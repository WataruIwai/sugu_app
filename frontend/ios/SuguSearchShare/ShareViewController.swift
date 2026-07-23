import UIKit
import UniformTypeIdentifiers

final class ShareViewController: UIViewController {
    private let statusLabel = UILabel()
    private let openButton = UIButton(type: .system)
    private let closeButton = UIButton(type: .system)
    private var didStartOpening = false
    private var pendingURL: URL?

    override func viewDidLoad() {
        super.viewDidLoad()

        view.backgroundColor = .systemBackground
        statusLabel.text = "Suguで検索中..."
        statusLabel.textAlignment = .center
        statusLabel.font = .preferredFont(forTextStyle: .headline)
        statusLabel.translatesAutoresizingMaskIntoConstraints = false

        openButton.setTitle("Suguを開く", for: .normal)
        openButton.titleLabel?.font = .preferredFont(forTextStyle: .headline)
        openButton.isHidden = true
        openButton.translatesAutoresizingMaskIntoConstraints = false
        openButton.addTarget(self, action: #selector(openSuguFromButton), for: .touchUpInside)

        closeButton.setTitle("閉じる", for: .normal)
        closeButton.titleLabel?.font = .preferredFont(forTextStyle: .body)
        closeButton.isHidden = true
        closeButton.translatesAutoresizingMaskIntoConstraints = false
        closeButton.addTarget(self, action: #selector(closeExtension), for: .touchUpInside)

        view.addSubview(statusLabel)
        view.addSubview(openButton)
        view.addSubview(closeButton)

        NSLayoutConstraint.activate([
            statusLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            statusLabel.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            statusLabel.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 24),
            statusLabel.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -24),
            openButton.topAnchor.constraint(equalTo: statusLabel.bottomAnchor, constant: 20),
            openButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            closeButton.topAnchor.constraint(equalTo: openButton.bottomAnchor, constant: 12),
            closeButton.centerXAnchor.constraint(equalTo: view.centerXAnchor)
        ])
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        guard !didStartOpening else {
            return
        }

        didStartOpening = true
        openSharedTextInSugu()
    }

    private func openSharedTextInSugu() {
        guard let extensionItems = extensionContext?.inputItems as? [NSExtensionItem] else {
            showFailure("共有されたテキストを取得できませんでした")
            return
        }

        for item in extensionItems {
            guard let attachments = item.attachments else {
                continue
            }

            for provider in attachments {
                if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                    loadText(from: provider, typeIdentifier: UTType.plainText.identifier)
                    return
                }

                if provider.hasItemConformingToTypeIdentifier(UTType.text.identifier) {
                    loadText(from: provider, typeIdentifier: UTType.text.identifier)
                    return
                }

                if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                    loadText(from: provider, typeIdentifier: UTType.url.identifier)
                    return
                }
            }
        }

        showFailure("共有されたテキストを取得できませんでした")
    }

    private func loadText(from provider: NSItemProvider, typeIdentifier: String) {
        provider.loadItem(forTypeIdentifier: typeIdentifier, options: nil) { [weak self] item, _ in
            let sharedText: String?

            if let text = item as? String {
                sharedText = text
            } else if let url = item as? URL {
                sharedText = url.absoluteString
            } else {
                sharedText = nil
            }

            DispatchQueue.main.async {
                guard
                    let self,
                    let searchWord = Self.extractSearchWord(from: sharedText),
                    let url = Self.makeSuguSearchURL(searchWord)
                else {
                    self?.showFailure("検索する単語を取得できませんでした")
                    return
                }

                self.pendingURL = url
                self.statusLabel.text = "Suguを開いています..."

                DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                    self.openURL(url, allowResponderFallback: true)
                }
            }
        }
    }

    private static func extractSearchWord(from text: String?) -> String? {
        guard let text else {
            return nil
        }

        let trimmedText = text.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !trimmedText.isEmpty else {
            return nil
        }

        let firstToken = trimmedText
            .components(separatedBy: .whitespacesAndNewlines)
            .first?
            .trimmingCharacters(in: CharacterSet(charactersIn: ".,;:!?()[]{}\"'“”‘’"))

        return firstToken?.isEmpty == false ? firstToken : nil
    }

    private static func makeSuguSearchURL(_ word: String) -> URL? {
        var components = URLComponents()
        components.scheme = "sugu"
        components.host = "search"
        components.queryItems = [
            URLQueryItem(name: "word", value: word)
        ]

        return components.url
    }

    private func completeRequest() {
        extensionContext?.completeRequest(returningItems: nil)
    }

    private func showFailure(_ message: String) {
        statusLabel.text = message
        openButton.isHidden = pendingURL == nil
        closeButton.isHidden = false
    }

    @objc private func openSuguFromButton() {
        guard let pendingURL else {
            showFailure("Suguを開けませんでした")
            return
        }

        statusLabel.text = "Suguを開いています..."
        openButton.isHidden = true
        closeButton.isHidden = true
        openURL(pendingURL, allowResponderFallback: true)
    }

    @objc private func closeExtension() {
        completeRequest()
    }

    private func openURL(_ url: URL, allowResponderFallback: Bool) {
        extensionContext?.open(url) { [weak self] success in
            DispatchQueue.main.async {
                guard let self else {
                    return
                }

                if success {
                    self.completeRequest()
                    return
                }

                if allowResponderFallback {
                    if self.openURLWithResponderChain(url) {
                        self.completeRequest()
                    } else {
                        self.showFailure("Suguを開けませんでした")
                    }
                    return
                }

                self.showFailure("自動で開けませんでした")
            }
        }
    }

    private func openURLWithResponderChain(_ url: URL) -> Bool {
        var responder: UIResponder? = self

        while let currentResponder = responder {
            let selector = NSSelectorFromString("openURL:")

            if currentResponder.responds(to: selector) {
                currentResponder.perform(selector, with: url)
                return true
            }

            responder = currentResponder.next
        }

        return false
    }
}
