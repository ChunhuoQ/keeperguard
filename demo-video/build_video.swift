import Foundation
import AVFoundation
import AppKit
import CoreVideo

let root = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let slidesDir = root.appendingPathComponent("slides", isDirectory: true)
let outputDir = root.appendingPathComponent("output", isDirectory: true)
try FileManager.default.createDirectory(at: outputDir, withIntermediateDirectories: true)
let silentURL = outputDir.appendingPathComponent("keeperguard-demo-silent.mp4")
let outputURL = outputDir.appendingPathComponent("keeperguard-demo.mp4")
let audioURL = root.appendingPathComponent("narration.aiff")
try? FileManager.default.removeItem(at: silentURL); try? FileManager.default.removeItem(at: outputURL)

let width = 1280, height = 720, fps: Int32 = 30
let durations = [8.0, 13.0, 13.0, 15.0, 14.0, 10.0]

func pixelBuffer(from image: NSImage) -> CVPixelBuffer? {
    var buffer: CVPixelBuffer?
    let attrs: [CFString: Any] = [kCVPixelBufferCGImageCompatibilityKey: true, kCVPixelBufferCGBitmapContextCompatibilityKey: true]
    guard CVPixelBufferCreate(kCFAllocatorDefault, width, height, kCVPixelFormatType_32ARGB, attrs as CFDictionary, &buffer) == kCVReturnSuccess, let pixelBuffer = buffer else { return nil }
    CVPixelBufferLockBaseAddress(pixelBuffer, []); defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, []) }
    guard let context = CGContext(data: CVPixelBufferGetBaseAddress(pixelBuffer), width: width, height: height, bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer), space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue), let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else { return nil }
    context.draw(cg, in: CGRect(x: 0, y: 0, width: width, height: height)); return pixelBuffer
}

let writer = try AVAssetWriter(outputURL: silentURL, fileType: .mp4)
let settings: [String: Any] = [AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: width, AVVideoHeightKey: height, AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 4_500_000, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel]]
let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings); input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB, kCVPixelBufferWidthKey as String: width, kCVPixelBufferHeightKey as String: height])
guard writer.canAdd(input) else { fatalError("Cannot add video input") }; writer.add(input); writer.startWriting(); writer.startSession(atSourceTime: .zero)
var frame: Int64 = 0
for i in 0..<durations.count {
    let slideURL = slidesDir.appendingPathComponent(String(format: "%02d.png", i + 1))
    guard let image = NSImage(contentsOf: slideURL), let buffer = pixelBuffer(from: image) else { fatalError("Cannot read slide \(i + 1)") }
    for _ in 0..<Int64(durations[i] * Double(fps)) {
        while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.002) }
        guard adaptor.append(buffer, withPresentationTime: CMTime(value: frame, timescale: fps)) else { fatalError("Frame append failed") }; frame += 1
    }
}
input.markAsFinished(); let writerDone = DispatchSemaphore(value: 0); writer.finishWriting { writerDone.signal() }; writerDone.wait()
guard writer.status == .completed else { fatalError("Video write failed") }

let composition = AVMutableComposition(), videoAsset = AVURLAsset(url: silentURL), audioAsset = AVURLAsset(url: audioURL)
guard let sourceVideo = videoAsset.tracks(withMediaType: .video).first, let videoTrack = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else { fatalError("Missing video") }
try videoTrack.insertTimeRange(CMTimeRange(start: .zero, duration: videoAsset.duration), of: sourceVideo, at: .zero)
if let sourceAudio = audioAsset.tracks(withMediaType: .audio).first, let audioTrack = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) { try audioTrack.insertTimeRange(CMTimeRange(start: .zero, duration: CMTimeMinimum(audioAsset.duration, videoAsset.duration)), of: sourceAudio, at: .zero) }
guard let exporter = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetHighestQuality) else { fatalError("Cannot export") }
exporter.outputURL = outputURL; exporter.outputFileType = .mp4; exporter.shouldOptimizeForNetworkUse = true
let done = DispatchSemaphore(value: 0); exporter.exportAsynchronously { done.signal() }; done.wait()
guard exporter.status == .completed else { fatalError("Export failed: \(String(describing: exporter.error))") }
print(outputURL.path)
