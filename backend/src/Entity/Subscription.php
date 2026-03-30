<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use App\Repository\SubscriptionRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

use App\State\OwnerSetter;

#[ORM\Entity(repositoryClass: SubscriptionRepository::class)]
#[ApiResource(
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Post(security: "is_granted('ROLE_USER')", processor: OwnerSetter::class),
        new Get(security: "is_granted('ROLE_ADMIN') or object.getOwner() == user"),
        new Patch(security: "is_granted('ROLE_ADMIN') or object.getOwner() == user"),
        new Delete(security: "is_granted('ROLE_ADMIN') or object.getOwner() == user"),
    ],
    normalizationContext: ['groups' => ['subscription:read']],
    denormalizationContext: ['groups' => ['subscription:write']],
)]
#[ApiFilter(SearchFilter::class, properties: ['status' => 'exact', 'category' => 'exact'])]
#[ApiFilter(OrderFilter::class, properties: ['nextRenewalAt', 'cost'])]
class Subscription
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['subscription:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 150)]
    #[Assert\NotBlank]
    #[Groups(['subscription:read', 'subscription:write'])]
    private ?string $name = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Assert\Url]
    #[Groups(['subscription:read', 'subscription:write'])]
    private ?string $url = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Assert\NotBlank]
    #[Assert\PositiveOrZero]
    #[Groups(['subscription:read', 'subscription:write'])]
    private ?string $cost = null;

    #[ORM\Column(length: 3)]
    #[Assert\NotBlank]
    #[Assert\Currency]
    #[Groups(['subscription:read', 'subscription:write'])]
    private ?string $currency = 'EUR';

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank]
    #[Assert\Choice(choices: ['monthly', 'yearly', 'weekly', 'quarterly'])]
    #[Groups(['subscription:read', 'subscription:write'])]
    private ?string $billingCycle = 'monthly';

    #[ORM\Column(type: Types::DATE_IMMUTABLE)]
    #[Assert\NotBlank]
    #[Groups(['subscription:read', 'subscription:write'])]
    private ?\DateTimeImmutable $nextRenewalAt = null;

    #[ORM\Column(length: 20)]
    #[Assert\Choice(choices: ['active', 'paused', 'cancelled'])]
    #[Groups(['subscription:read', 'subscription:write'])]
    private ?string $status = 'active';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['subscription:read', 'subscription:write'])]
    private ?string $notes = null;

    #[ORM\ManyToOne(inversedBy: 'subscriptions')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $owner = null;

    #[ORM\ManyToOne(inversedBy: 'subscriptions')]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['subscription:read', 'subscription:write'])]
    private ?Category $category = null;

    #[ORM\Column]
    #[Groups(['subscription:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getUrl(): ?string
    {
        return $this->url;
    }

    public function setUrl(?string $url): static
    {
        $this->url = $url;

        return $this;
    }

    public function getCost(): ?string
    {
        return $this->cost;
    }

    public function setCost(string $cost): static
    {
        $this->cost = $cost;

        return $this;
    }

    public function getCurrency(): ?string
    {
        return $this->currency;
    }

    public function setCurrency(string $currency): static
    {
        $this->currency = $currency;

        return $this;
    }

    public function getBillingCycle(): ?string
    {
        return $this->billingCycle;
    }

    public function setBillingCycle(string $billingCycle): static
    {
        $this->billingCycle = $billingCycle;

        return $this;
    }

    public function getNextRenewalAt(): ?\DateTimeImmutable
    {
        return $this->nextRenewalAt;
    }

    public function setNextRenewalAt(\DateTimeImmutable $nextRenewalAt): static
    {
        $this->nextRenewalAt = $nextRenewalAt;

        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function setNotes(?string $notes): static
    {
        $this->notes = $notes;

        return $this;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): static
    {
        $this->owner = $owner;

        return $this;
    }

    public function getCategory(): ?Category
    {
        return $this->category;
    }

    public function setCategory(?Category $category): static
    {
        $this->category = $category;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }
}
