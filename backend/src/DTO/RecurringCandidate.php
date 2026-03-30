<?php

namespace App\DTO;

final class RecurringCandidate
{
    public function __construct(
        public readonly string $name,
        public readonly float $amount,
        public readonly string $currency,
        public readonly string $billingCycle,   // monthly | yearly | weekly | quarterly
        public readonly string $confidence,     // low | medium | high
        public readonly int $occurrences,
        public readonly string $lastSeen,       // ISO date string
        public readonly string $nextRenewalAt,  // ISO date string (predicted)
    ) {}

    public function toArray(): array
    {
        return [
            'name'          => $this->name,
            'amount'        => $this->amount,
            'currency'      => $this->currency,
            'billingCycle'  => $this->billingCycle,
            'confidence'    => $this->confidence,
            'occurrences'   => $this->occurrences,
            'lastSeen'      => $this->lastSeen,
            'nextRenewalAt' => $this->nextRenewalAt,
        ];
    }
}
