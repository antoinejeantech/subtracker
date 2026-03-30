<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use Symfony\Bundle\SecurityBundle\Security;
use App\Entity\User;

final class OwnerSetter implements ProcessorInterface
{
    public function __construct(
        private readonly ProcessorInterface $processor,
        private readonly Security $security,
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        $user = $this->security->getUser();

        if ($user instanceof User && method_exists($data, 'setOwner') && method_exists($data, 'getOwner') && $data->getOwner() === null) {
            $data->setOwner($user);
        }

        return $this->processor->process($data, $operation, $uriVariables, $context);
    }
}
