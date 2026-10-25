import Capacitor
import CoreImage
import Foundation
import UIKit
import Vision

/// Stellt das Hauptmotiv eines Fotos frei – dieselbe Technik wie „Motiv freistellen“ in der Fotos-App (ab iOS 17).
/// Eingabe und Ausgabe sind Base64-kodierte Bilder; das Ergebnis ist ein PNG mit transparentem Hintergrund.
@objc(SubjectLiftPlugin)
public class SubjectLiftPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SubjectLiftPlugin"
    public let jsName = "SubjectLift"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "liftSubject", returnType: CAPPluginReturnPromise)
    ]

    private let context = CIContext()

    @objc func isAvailable(_ call: CAPPluginCall) {
        if #available(iOS 17.0, *) {
            call.resolve(["available": true])
        } else {
            call.resolve(["available": false])
        }
    }

    @objc func liftSubject(_ call: CAPPluginCall) {
        guard #available(iOS 17.0, *) else {
            call.unavailable("Freistellen benötigt iOS 17 oder neuer")
            return
        }
        guard let base64 = call.getString("image"),
              let data = Data(base64Encoded: base64),
              let input = CIImage(data: data, options: [.applyOrientationProperty: true]) else {
            call.reject("Ungültiges Bild")
            return
        }

        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let request = VNGenerateForegroundInstanceMaskRequest()
                let handler = VNImageRequestHandler(ciImage: input)
                try handler.perform([request])
                guard let observation = request.results?.first, !observation.allInstances.isEmpty else {
                    call.reject("Keine Pflanze erkannt")
                    return
                }
                let buffer = try observation.generateMaskedImage(
                    ofInstances: observation.allInstances,
                    from: handler,
                    croppedToInstancesExtent: false
                )
                let masked = CIImage(cvPixelBuffer: buffer)
                guard let cgImage = self.context.createCGImage(masked, from: masked.extent),
                      let png = UIImage(cgImage: cgImage).pngData() else {
                    call.reject("Ergebnis konnte nicht erzeugt werden")
                    return
                }
                call.resolve(["image": png.base64EncodedString()])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }
}
