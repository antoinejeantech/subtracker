<?php

namespace App\DTO;

final class Transaction
{
    public function __construct(
        public readonly \DateTimeImmutable $date,
        public readonly string $description,
        public readonly float $amount,
    ) {}
}
