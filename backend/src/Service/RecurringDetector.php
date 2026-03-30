<?php

namespace App\Service;

use App\DTO\RecurringCandidate;
use App\DTO\Transaction;

final class RecurringDetector
{
    /**
     * Cycle definitions: label => expected days, with tolerance factor.
     * Tolerance: ±20% of the expected days.
     */
    private const CYCLES = [
        'weekly'     => 7,
        'monthly'    => 30,
        'quarterly'  => 91,
        'yearly'     => 365,
    ];

    private const TOLERANCE = 0.20;

    public function __construct(private readonly MerchantNormalizer $normalizer) {}

    /**
     * @param Transaction[] $transactions
     * @return RecurringCandidate[]
     */
    public function detect(array $transactions, string $currency = 'EUR'): array
    {
        // Group by (normalizedName, roundedAmount)
        $groups = [];
        foreach ($transactions as $tx) {
            $name = $this->normalizer->normalize($tx->description);
            if ($name === null) {
                continue; // transfer / internal movement — skip
            }
            // Round amount to 2 decimal places for grouping
            $amount = round($tx->amount, 2);
            $key    = $name . '|||' . $amount;
            $groups[$key][] = $tx;
        }

        $candidates = [];

        foreach ($groups as $key => $txs) {
            if (count($txs) < 2) {
                continue;
            }

            [$name, $amountStr] = explode('|||', $key, 2);
            $amount = (float) $amountStr;

            // Sort by date ascending
            usort($txs, static fn(Transaction $a, Transaction $b) => $a->date <=> $b->date);

            // Compute day-intervals between consecutive occurrences
            $intervals = [];
            for ($i = 1; $i < count($txs); $i++) {
                $intervals[] = (int) $txs[$i - 1]->date->diff($txs[$i]->date)->days;
            }

            $cycle = $this->detectCycle($intervals);
            if ($cycle === null) {
                continue;
            }

            $occurrences = count($txs);
            $lastSeen    = end($txs)->date;
            $nextRenewal = $this->predictNextRenewal($lastSeen, $cycle);

            $confidence = $this->scoreConfidence($occurrences, $intervals, $cycle);

            $candidates[] = new RecurringCandidate(
                name: $name,
                amount: $amount,
                currency: $currency,
                billingCycle: $cycle,
                confidence: $confidence,
                occurrences: $occurrences,
                lastSeen: $lastSeen->format('Y-m-d'),
                nextRenewalAt: $nextRenewal->format('Y-m-d'),
            );
        }

        // Sort by confidence desc, then amount desc
        usort($candidates, static function (RecurringCandidate $a, RecurringCandidate $b) {
            $order = ['high' => 0, 'medium' => 1, 'low' => 2];
            $cmp = $order[$a->confidence] <=> $order[$b->confidence];
            return $cmp !== 0 ? $cmp : $b->amount <=> $a->amount;
        });

        return $candidates;
    }

    /**
     * @param int[] $intervals
     */
    private function detectCycle(array $intervals): ?string
    {
        if (empty($intervals)) {
            return null;
        }

        $avg = array_sum($intervals) / count($intervals);

        foreach (self::CYCLES as $label => $expected) {
            $tolerance = $expected * self::TOLERANCE;
            if (abs($avg - $expected) <= $tolerance) {
                return $label;
            }
        }

        return null;
    }

    /**
     * @param int[] $intervals
     */
    private function scoreConfidence(int $occurrences, array $intervals, string $cycle): string
    {
        $expected  = self::CYCLES[$cycle];
        $tolerance = $expected * self::TOLERANCE;

        // Measure how many intervals are within tolerance
        $consistent = array_filter(
            $intervals,
            static fn(int $d) => abs($d - $expected) <= $tolerance,
        );
        $consistencyRatio = count($consistent) / count($intervals);

        if ($occurrences >= 4 && $consistencyRatio >= 0.75) {
            return 'high';
        }
        if ($occurrences >= 3 && $consistencyRatio >= 0.5) {
            return 'medium';
        }
        return 'low';
    }

    private function predictNextRenewal(\DateTimeImmutable $lastSeen, string $cycle): \DateTimeImmutable
    {
        $daysMap = self::CYCLES;
        $days    = $daysMap[$cycle];

        $next = $lastSeen->modify("+{$days} days");

        // If the predicted date is in the past, keep adding one cycle until it's in the future
        $today = new \DateTimeImmutable('today');
        while ($next < $today) {
            $next = $next->modify("+{$days} days");
        }

        return $next;
    }
}
