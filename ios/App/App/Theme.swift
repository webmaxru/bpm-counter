import SwiftUI

enum BPMTheme {
    static let ink = Color(red: 7 / 255, green: 28 / 255, blue: 43 / 255)
    static let inkSoft = Color(red: 10 / 255, green: 38 / 255, blue: 56 / 255)
    static let surface = Color(red: 12 / 255, green: 48 / 255, blue: 70 / 255)
    static let surfaceStrong = Color(red: 17 / 255, green: 62 / 255, blue: 87 / 255)
    static let text = Color(red: 247 / 255, green: 243 / 255, blue: 237 / 255)
    static let textMuted = Color(red: 185 / 255, green: 207 / 255, blue: 216 / 255)
    static let textFaint = Color(red: 135 / 255, green: 169 / 255, blue: 183 / 255)
    static let accent = Color(red: 255 / 255, green: 179 / 255, blue: 107 / 255)
    static let accentStrong = Color(red: 255 / 255, green: 139 / 255, blue: 92 / 255)
    static let signal = Color(red: 105 / 255, green: 222 / 255, blue: 213 / 255)
    static let danger = Color(red: 255 / 255, green: 139 / 255, blue: 122 / 255)

    static let backgroundGradient = LinearGradient(
        colors: [
            Color(red: 41 / 255, green: 126 / 255, blue: 151 / 255).opacity(0.28),
            ink,
            Color(red: 255 / 255, green: 139 / 255, blue: 92 / 255).opacity(0.08),
        ],
        startPoint: .top,
        endPoint: .bottom
    )
}

struct PrimaryButtonStyle: ButtonStyle {
    var filled: Bool = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline.weight(.semibold))
            .foregroundStyle(filled ? BPMTheme.ink : BPMTheme.text)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(filled ? BPMTheme.accent : BPMTheme.surfaceStrong)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(BPMTheme.textFaint.opacity(filled ? 0 : 0.35), lineWidth: 1)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}
