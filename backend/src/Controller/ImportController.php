<?php

namespace App\Controller;

use App\Service\CsvParser;
use App\Service\RecurringDetector;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/import')]
#[IsGranted('ROLE_USER')]
final class ImportController extends AbstractController
{
    public function __construct(
        private readonly CsvParser $csvParser,
        private readonly RecurringDetector $detector,
    ) {}

    #[Route('/analyze', methods: ['POST'])]
    public function analyze(Request $request): JsonResponse
    {
        $file = $request->files->get('file');
        if ($file === null) {
            return $this->json(['error' => 'No file uploaded.'], 400);
        }

        $dateCol        = $request->request->get('date_col', '');
        $descriptionCol = $request->request->get('description_col', '');
        $amountCol      = $request->request->get('amount_col', '');
        $currency       = $request->request->get('currency', 'EUR');
        $delimiter      = $request->request->get('delimiter', 'auto');

        if ($dateCol === '' || $descriptionCol === '' || $amountCol === '') {
            return $this->json(['error' => 'date_col, description_col and amount_col are required.'], 400);
        }

        try {
            $transactions = $this->csvParser->parse(
                $file,
                $dateCol,
                $descriptionCol,
                $amountCol,
                $delimiter,
            );
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 422);
        }

        if (empty($transactions)) {
            return $this->json(['error' => 'No valid transactions found in the file.'], 422);
        }

        $candidates = $this->detector->detect($transactions, strtoupper($currency));

        return $this->json([
            'transactionCount' => count($transactions),
            'candidates'       => array_map(
                static fn($c) => $c->toArray(),
                $candidates,
            ),
        ]);
    }

    /**
     * Preview endpoint: returns parsed column headers from the uploaded CSV
     * so the frontend can render the column-mapping step.
     */
    #[Route('/preview', methods: ['POST'])]
    public function preview(Request $request): JsonResponse
    {
        $file = $request->files->get('file');
        if ($file === null) {
            return $this->json(['error' => 'No file uploaded.'], 400);
        }

        if ($file->getSize() > 5 * 1024 * 1024) {
            return $this->json(['error' => 'File exceeds 5 MB limit.'], 422);
        }

        $content = $file->getContent();
        $delimiter = $request->request->get('delimiter', 'auto');
        if ($delimiter === 'auto') {
            $delimiter = $this->detectDelimiter($content);
        }

        $firstLine = strtok(str_replace("\r\n", "\n", $content), "\n");
        $headers   = array_map('trim', str_getcsv($firstLine, $delimiter, '"'));

        // Also return a sample of the first 3 data rows for the user to confirm mapping
        $lines  = array_filter(
            array_map('trim', explode("\n", str_replace("\r\n", "\n", $content))),
            static fn(string $l) => $l !== '',
        );
        $sample = [];
        foreach (array_slice(array_values($lines), 1, 3) as $line) {
            $sample[] = array_map('trim', str_getcsv($line, $delimiter, '"'));
        }

        return $this->json([
            'headers' => $headers,
            'sample'  => $sample,
        ]);
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
        arsort($counts);
        return (string) array_key_first($counts) ?: ',';
    }
}
