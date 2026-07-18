import Foundation
import WidgetKit

@objc(SuguWidgetBridge)
final class SuguWidgetBridge: NSObject {
    private let appGroupId = "group.com.sugu.ios"
    private let widgetDefaultsKey = "widgetFeaturedWord"

    @objc
    static func requiresMainQueueSetup() -> Bool {
        false
    }

    @objc(saveSnapshot:resolver:rejecter:)
    func saveSnapshot(_ snapshot: String, resolver: RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) {
        guard let defaults = UserDefaults(suiteName: appGroupId) else {
            rejecter("APP_GROUP_UNAVAILABLE", "App Group storage is unavailable.", nil)
            return
        }

        defaults.set(snapshot, forKey: widgetDefaultsKey)
        defaults.synchronize()
        WidgetCenter.shared.reloadTimelines(ofKind: "SuguWidget")
        WidgetCenter.shared.reloadAllTimelines()
        resolver(nil)
    }

    @objc(getSnapshot:rejecter:)
    func getSnapshot(_ resolver: RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) {
        guard let defaults = UserDefaults(suiteName: appGroupId) else {
            rejecter("APP_GROUP_UNAVAILABLE", "App Group storage is unavailable.", nil)
            return
        }

        resolver(defaults.string(forKey: widgetDefaultsKey))
    }

    @objc(clearSnapshot:rejecter:)
    func clearSnapshot(_ resolver: RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) {
        guard let defaults = UserDefaults(suiteName: appGroupId) else {
            rejecter("APP_GROUP_UNAVAILABLE", "App Group storage is unavailable.", nil)
            return
        }

        defaults.removeObject(forKey: widgetDefaultsKey)
        defaults.removeObject(forKey: "widgetLastShownWordId")
        defaults.synchronize()
        WidgetCenter.shared.reloadTimelines(ofKind: "SuguWidget")
        WidgetCenter.shared.reloadAllTimelines()
        resolver(nil)
    }
}
