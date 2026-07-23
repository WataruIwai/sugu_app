import SwiftUI
import WidgetKit

private let appGroupId = "group.com.sugu.ios"
private let widgetDefaultsKey = "widgetFeaturedWord"

struct WidgetSnapshot: Decodable {
    let updatedAt: String
    let lastShownWordId: String?
    let words: [WidgetWord]
}

struct WidgetWord: Decodable, Identifiable {
    let id: String
    let term: String
    let primaryMeaningEn: String
    let primaryMeaningJa: String
    let exampleEn: String?
    let meaningCount: Int
}

struct SuguWidgetEntry: TimelineEntry {
    let date: Date
    let word: WidgetWord?
}

struct SuguWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> SuguWidgetEntry {
        SuguWidgetEntry(date: Date(), word: sampleWord)
    }

    func getSnapshot(in context: Context, completion: @escaping (SuguWidgetEntry) -> Void) {
        completion(SuguWidgetEntry(date: Date(), word: loadWord()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SuguWidgetEntry>) -> Void) {
        let now = Date()
        let entry = SuguWidgetEntry(date: now, word: loadWord())
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: now)
            ?? now.addingTimeInterval(1800)
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func loadWord() -> WidgetWord? {
        guard
            let defaults = UserDefaults(suiteName: appGroupId),
            let json = defaults.string(forKey: widgetDefaultsKey),
            let data = json.data(using: .utf8),
            let snapshot = try? JSONDecoder().decode(WidgetSnapshot.self, from: data),
            !snapshot.words.isEmpty
        else {
            return nil
        }

        let lastShownWordId = defaults.string(forKey: "widgetLastShownWordId") ?? snapshot.lastShownWordId
        let candidates = snapshot.words.count > 1
            ? snapshot.words.filter { $0.id != lastShownWordId }
            : snapshot.words
        let word = (candidates.isEmpty ? snapshot.words : candidates).randomElement()

        if let word {
            defaults.set(word.id, forKey: "widgetLastShownWordId")
        }

        return word
    }

    private var sampleWord: WidgetWord {
        WidgetWord(
            id: "sample",
            term: "come out",
            primaryMeaningEn: "to become known or visible",
            primaryMeaningJa: "明らかになる",
            exampleEn: "The truth will come out soon.",
            meaningCount: 2
        )
    }
}

struct SuguWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: SuguWidgetEntry

    var body: some View {
        Group {
            if let word = entry.word {
                content(for: word)
                    .widgetURL(URL(string: "sugu://word/\(word.id)"))
            } else {
                emptyContent
                    .widgetURL(URL(string: "sugu://search"))
            }
        }
        .suguWidgetBackground()
    }

    @ViewBuilder
    private func content(for word: WidgetWord) -> some View {
        switch family {
        case .systemLarge:
            VStack(alignment: .leading, spacing: 14) {
                Text(word.term)
                    .font(.custom("Helvetica", size: 38).weight(.bold))
                    .foregroundStyle(Color(hex: 0x111111))
                    .lineLimit(2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text(japaneseMeaning(for: word))
                    .font(.custom("Helvetica", size: 15).weight(.semibold))
                    .foregroundStyle(Color(hex: 0x111111))
                    .lineSpacing(3)
                    .lineLimit(8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                if !word.primaryMeaningEn.isEmpty {
                    Text(word.primaryMeaningEn)
                        .font(.custom("Helvetica", size: 15).weight(.semibold))
                        .foregroundStyle(Color(hex: 0x6F6F73))
                        .lineSpacing(3)
                        .lineLimit(4)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                if let example = word.exampleEn?.trimmingCharacters(in: .whitespacesAndNewlines),
                   !example.isEmpty {
                    Text(example)
                        .font(.custom("Helvetica", size: 15).weight(.semibold))
                        .foregroundStyle(Color(hex: 0x8A8A8E))
                        .lineSpacing(3)
                        .lineLimit(4)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.top, 4)
                }
                if word.meaningCount > 1 {
                    Text("他\(word.meaningCount - 1)件の意味")
                        .font(.custom("Helvetica", size: 12).weight(.semibold))
                        .foregroundStyle(Color(hex: 0x8A8A8E))
                        .lineLimit(1)
                        .padding(.top, 2)
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .padding(.horizontal, 20)
            .padding(.vertical, 22)
        case .systemMedium:
            VStack(alignment: .leading, spacing: 10) {
                Text(word.term)
                    .font(.custom("Helvetica", size: 27).weight(.bold))
                    .foregroundStyle(Color(hex: 0x111111))
                    .lineLimit(1)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text(japaneseMeaning(for: word))
                    .font(.custom("Helvetica", size: 15).weight(.semibold))
                    .foregroundStyle(Color(hex: 0x111111))
                    .lineSpacing(3)
                    .lineLimit(2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                if !word.primaryMeaningEn.isEmpty {
                    Text(word.primaryMeaningEn)
                        .font(.custom("Helvetica", size: 13).weight(.semibold))
                        .foregroundStyle(Color(hex: 0x6F6F73))
                        .padding(.top, 2)
                        .lineLimit(1)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                if word.meaningCount > 1 {
                    Text("他\(word.meaningCount - 1)件の意味")
                        .font(.custom("Helvetica", size: 11))
                        .foregroundStyle(Color(hex: 0x8A8A8E))
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .padding(16)
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 2) {
                Text(word.term)
                    .font(.headline.weight(.bold))
                    .lineLimit(1)
                Text(japaneseMeaning(for: word))
                    .font(.caption)
                    .lineLimit(1)
            }
        case .accessoryInline:
            Text("\(word.term) | \(japaneseMeaning(for: word))")
        case .accessoryCircular:
            Text(monogram(for: word.term))
                .font(.system(size: 18, weight: .bold, design: .rounded))
        default:
            VStack(alignment: .leading, spacing: 10) {
                Text(word.term)
                    .font(.custom("Helvetica", size: 24).weight(.bold))
                    .foregroundStyle(Color(hex: 0x111111))
                    .lineLimit(1)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text(japaneseMeaning(for: word))
                    .font(.custom("Helvetica", size: 14).weight(.semibold))
                    .foregroundStyle(Color(hex: 0x111111))
                    .lineSpacing(3)
                    .lineLimit(2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .padding(16)
        }
    }

    @ViewBuilder
    private var emptyContent: some View {
        switch family {
        case .systemLarge:
            VStack(alignment: .leading, spacing: 12) {
                Text("Sugu")
                    .font(.custom("Helvetica", size: 32).weight(.bold))
                    .foregroundStyle(Color(hex: 0x111111))
                Text("単語を選ぶと\nここに表示されます")
                    .font(.custom("Helvetica", size: 16).weight(.semibold))
                    .foregroundStyle(Color(hex: 0x8A8A8E))
                    .lineSpacing(4)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .padding(20)
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 2) {
                Text("Sugu")
                    .font(.headline.weight(.semibold))
                Text("単語を保存しよう")
                    .font(.caption)
            }
        case .accessoryInline:
            Text("Sugu | 単語を保存しよう")
        case .accessoryCircular:
            Text("S")
                .font(.system(size: 18, weight: .bold, design: .rounded))
        default:
            VStack(alignment: .leading, spacing: 8) {
                Text("Sugu")
                    .font(.custom("Helvetica", size: 24).weight(.semibold))
                    .foregroundStyle(Color(hex: 0x111111))
                Text("単語を保存すると\nここに表示されます")
                    .font(.custom("Helvetica", size: 14).weight(.semibold))
                    .foregroundStyle(Color(hex: 0x8A8A8E))
                    .lineSpacing(3)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .padding(16)
        }
    }

    private func monogram(for term: String) -> String {
        let trimmed = term.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? "S" : String(trimmed.prefix(2)).uppercased()
    }

    private func japaneseMeaning(for word: WidgetWord) -> String {
        let meaning = word.primaryMeaningJa.trimmingCharacters(in: .whitespacesAndNewlines)
        return meaning.isEmpty ? word.primaryMeaningEn : meaning
    }
}

@main
struct SuguWidget: Widget {
    let kind = "SuguWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SuguWidgetProvider()) { entry in
            SuguWidgetView(entry: entry)
        }
        .configurationDisplayName("Sugu")
        .description("選択した単語を表示します。")
        .supportedFamilies([
            .systemSmall,
            .systemMedium,
            .systemLarge,
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline
        ])
    }
}

private extension Color {
    init(hex: UInt) {
        self.init(
            red: Double((hex >> 16) & 0xff) / 255,
            green: Double((hex >> 8) & 0xff) / 255,
            blue: Double(hex & 0xff) / 255
        )
    }
}

private extension View {
    @ViewBuilder
    func suguWidgetBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            containerBackground(.white, for: .widget)
        } else {
            background(Color.white)
        }
    }
}
