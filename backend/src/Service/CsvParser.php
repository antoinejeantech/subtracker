<?php

namespace App\Service;

use App\DTO\Transaction;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class CsvParser
{
    private const ALLOWED_MIMES = ['text/csv', 'text/plain', 'application/csv', 'application/vnd.ms-excel'];
    private const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

    /**
     * @return Transaction[]
     */
    public function parse(
        UploadedFile $file,
        string $dateCol,
        string $descriptionCol,
        string $amountCol,
        string $delimiter = ',',
    ): array {
        if ($file->getSize() > self::MAX_BYTES) {
            throw new \InvalidArgumentException('File exceeds 5 MB limit.');
        }

        $content = $file->getContent();
        // Detect delimiter if not specified
        if ($delimiter === 'auto') {
            $delimiter = $this->detectDelimiter($content);
        }

        $lines = array_filter(
            array_map('trim', explode("\n", str_replace("\r\n", "\n", $content))),
            static fn(string $l) => $l !== '',
        );

        if (count($lines) < 2) {
            throw new \InvalidArgumentException('File must contain a header row and at least one data row.');
        }

        $headers = $this->parseLine(array_shift($lines), $delimiter);
        $headers = array_map('trim', $headers);

        $dateIdx   = $this->resolveColumn($headers, $dateCol);
        $descIdx   = $this->resolveColumn($headers, $descriptionCol);
        $amountIdx = $this->resolveColumn($headers, $amountCol);

        $transactions = [];
        foreach ($lines as $line) {
            $cols = $this->parseLine($line, $delimiter);

            $rawDate   = trim($cols[$dateIdx] ?? '');
            $rawDesc   = trim($cols[$descIdx] ?? '');
            $rawAmount = trim($cols[$amountIdx] ?? '');

            if ($rawDate === '' || $rawDesc === '' || $rawAmount === '') {
                continue;
            }

            $date = $this->parseDate($rawDate);
            if ($date === null) {
                continue;
            }

            // Normalize amount: remove currency symbols, spaces, replace comma decimal
            $rawAmount = preg_replace('/[^\d.,-]/', '', $rawAmount);
            $rawAmount = str_replace(',', '.', $rawAmount);
            $amount = (float) $rawAmount;

            if ($amount === 0.0) {
                continue;
            }

            // Only keep debits (expenses). Accept negative amounts too — take absolute value.
            $amount = abs($amount);

            $transactions[] = new Transaction($date, $rawDesc, $amount);
        }

        return $transactions;
    }

    /**
     * @param string[] $headers
     */
    private function resolveColumn(array $headers, string $col): int
    {
        // Try by name first (case-insensitive)
        foreach ($headers as $i => $h) {
            if (strtolower($h) === strtolower($col)) {
                return $i;
            }
        }
        // Fall back to numeric index
        if (is_numeric($col)) {
            $idx = (int) $col;
            if (isset($headers[$idx])) {
                return $idx;
            }
        }
        throw new \InvalidArgumentException(sprintf('Column "%s" not found. Available: %s', $col, implode(', ', $headers)));
    }

    private function parseLine(string $line, string $delimiter): array
    {
        return str_getcsv($line, $delimiter, '"');
    }

    private function detectDelimiter(string $content): string
    {
        $firstLine = strtok($content, "\n");
        $counts = [
            ','  => substr_count($firstLine, ','),
            ';'  => substr_count($firstLine, ';'),
            "\t" => substr_count($firstLine, "\t"),
            '|'  => substr_count($firstLine, '|'),
        ];
        return (string) array_key_first(array_slice(arsort($counts) ? $counts : $counts, 0, 1)) ?: ',';
    }

    private function parseDate(string $raw): ?\DateTimeImmutable
    {
        $formats = [
            'd/m/Y', 'm/d/Y', 'Y-m-d', 'd-m-Y', 'd.m.Y',
            'd/m/y', 'm/d/y', 'Y/m/d',
        ];
        foreach ($formats as $fmt) {
            $dt = \DateTimeImmutable::createFromFormat($fmt, $raw);
            if ($dt !== false) {
                return $dt->setTime(0, 0);
            }
        }
        // Last resort: strtotime
        $ts = strtotime($raw);
        if ($ts !== false) {
            return new \DateTimeImmutable('@' . $ts);
        }
        return null;
    }
}
