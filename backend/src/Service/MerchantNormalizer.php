<?php

namespace App\Service;

final class MerchantNormalizer
{
    /**
     * Patterns to strip from transaction descriptions before grouping.
     * Order matters — applied sequentially.
     */
    private const STRIP_PATTERNS = [
        // Card/payment reference codes: sequences of digits/uppercase mixed with spaces
        '/\b[A-Z0-9]{8,}\b/',
        // "REF:", "REF :", "#12345", "*12345"
        '/\b(?:REF|TXN|TRANSACTION|ORDER|CMD|NO|NUM)[:\s#*]?\s*\w+/i',
        // Trailing/leading punctuation and reference numbers
        '/[#*]\d+/',
        // Standalone long digit sequences (card bits, order ids)
        '/\b\d{4,}\b/',
        // Common prefixes banks add
        '/^(?:PAIEMENT\s+(?:PAR\s+CARTE\s+)?(?:CB|VISA|MASTERCARD|SC)\s+)/i',
        '/^(?:CARTE\s+\d+\s+)/i',
        '/^(?:VIR(?:EMENT)?\s+(?:SEPA\s+)?(?:INST\s+)?(?:DE\s+|A\s+)?)/i',
        '/^(?:PRELEVEMENT\s+(?:SEPA\s+)?)/i',
        '/^(?:DEBIT\s+)/i',
        '/^(?:ACHAT\s+)/i',
        '/^(?:PAYMENT\s+TO\s+)/i',
        '/^(?:RECURRING\s+PAYMENT\s+)/i',
        // Dates embedded in description (e.g. "01/03")
        '/\b\d{2}\/\d{2}(?:\/\d{2,4})?\b/',
        // Country codes at end
        '/\s+[A-Z]{2}\s*$/',
        // Extra whitespace
        '/\s{2,}/',
    ];

    /**
     * If the raw description matches any of these patterns, the transaction
     * is NOT a subscription (transfer, internal movement, refund, ATM, etc.)
     * and should be skipped entirely.
     */
    private const SKIP_PATTERNS = [
        // Revolut internal features
        '/robo.?portfolio/i',
        '/savings/i',
        '/vault/i',
        '/round.?up/i',
        '/cashback/i',
        '/pocket/i',
        '/stock/i',
        '/crypto/i',
        '/exchange/i',
        '/top.?up/i',
        '/add money/i',
        // Generic transfers
        '/^(?:to|from)\s+\w/i',
        '/transfer/i',
        '/virement/i',
        '/vir\b/i',
        '/remboursement/i',
        '/refund/i',
        '/reimburs/i',
        // ATM / cash
        '/\batm\b/i',
        '/retrait/i',
        '/withdrawal/i',
        // Peer-to-peer
        '/\bpaypal\s+transfer/i',
        '/\bwise\s+transfer/i',
        '/\blydia/i',
        '/\bsumeria/i',
        // Insurance one-offs
        '/\bassurance\b/i',
    ];


    private const KNOWN_MERCHANTS = [
        'NETFLIX'        => 'Netflix',
        'SPOTIFY'        => 'Spotify',
        'APPLE'          => 'Apple',
        'APPLE.COM'      => 'Apple',
        'APPLECOM'       => 'Apple',
        'AMAZON'         => 'Amazon',
        'AMAZON PRIME'   => 'Amazon Prime',
        'AMAZONPRIME'    => 'Amazon Prime',
        'AMAZON WEB'     => 'Amazon AWS',
        'AWS'            => 'Amazon AWS',
        'GOOGLE'         => 'Google',
        'YOUTUBE'        => 'YouTube Premium',
        'YOUTUBE PREMIUM'=> 'YouTube Premium',
        'MICROSOFT'      => 'Microsoft',
        'OFFICE 365'     => 'Microsoft 365',
        'MICROSOFT 365'  => 'Microsoft 365',
        'ADOBE'          => 'Adobe',
        'GITHUB'         => 'GitHub',
        'GITHUB.COM'     => 'GitHub',
        'GITHUBCOM'      => 'GitHub',
        'GH PAGES'       => 'GitHub',
        'DISCORD'        => 'Discord',
        'NOTION'         => 'Notion',
        'FIGMA'          => 'Figma',
        'CANVA'          => 'Canva',
        'DROPBOX'        => 'Dropbox',
        'SLACK'          => 'Slack',
        'ZOOM'           => 'Zoom',
        'DOCTOLIB'       => 'Doctolib',
        'NordVPN'        => 'NordVPN',
        'NORDVPN'        => 'NordVPN',
        'EXPRESSVPN'     => 'ExpressVPN',
        'PROTON'         => 'Proton',
        'PROTONMAIL'     => 'Proton Mail',
        'PROTONVPN'      => 'Proton VPN',
        'DEEZER'         => 'Deezer',
        'CANAL'          => 'Canal+',
        'DISNEY'         => 'Disney+',
        'DISNEYPLUS'     => 'Disney+',
        'PARAMOUNT'      => 'Paramount+',
        'HULU'           => 'Hulu',
        'HBO'            => 'HBO Max',
        'LINKEDIN'       => 'LinkedIn',
        'DUOLINGO'       => 'Duolingo',
        'HEADSPACE'      => 'Headspace',
        'CALM'           => 'Calm',
        'STRAVA'         => 'Strava',
        'NYTIMES'        => 'NY Times',
        'NEW YORK TIMES' => 'NY Times',
        'MEDIUM'         => 'Medium',
        'SUBSTACK'       => 'Substack',
        'PATREON'        => 'Patreon',
        'TWITCH'         => 'Twitch',
        'OPENAI'         => 'OpenAI',
        'CHATGPT'        => 'ChatGPT',
        'ANTHROPIC'      => 'Anthropic',
        'CURSOR'         => 'Cursor',
        'VERCEL'         => 'Vercel',
        'NETLIFY'        => 'Netlify',
        'CLOUDFLARE'     => 'Cloudflare',
        'DIGITALOCEAN'   => 'DigitalOcean',
        'HEROKU'         => 'Heroku',
        'HETZNER'        => 'Hetzner',
        'OVH'            => 'OVH',
        'SCALEWAY'       => 'Scaleway',
    ];

    public function normalize(string $description): ?string
    {
        // Skip non-subscription transactions (transfers, savings, refunds…)
        foreach (self::SKIP_PATTERNS as $pattern) {
            if (preg_match($pattern, $description)) {
                return null;
            }
        }

        $raw = mb_strtoupper(trim($description));

        foreach (self::STRIP_PATTERNS as $pattern) {
            $raw = (string) preg_replace($pattern, ' ', $raw);
        }

        $normalized = trim($raw);

        // Try to match a known merchant (longest match wins)
        $best = null;
        $bestLen = 0;
        foreach (self::KNOWN_MERCHANTS as $key => $friendly) {
            $keyUp = mb_strtoupper($key);
            if (str_contains($normalized, $keyUp) && strlen($key) > $bestLen) {
                $best = $friendly;
                $bestLen = strlen($key);
            }
        }

        if ($best !== null) {
            return $best;
        }

        // Title-case the cleaned string as fallback
        return mb_convert_case($normalized, MB_CASE_TITLE);
    }
}
