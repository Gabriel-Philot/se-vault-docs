import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for the Python Data Race application.
 *
 * Prerequisites: The full stack must be running via `docker compose up --build`.
 * The frontend should be accessible at the configured baseURL (default: http://localhost:3000).
 */

test.describe('Python Data Race', () => {
  test.describe('Page Load', () => {
    test('should display the page title "Python Data Race"', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle('Python Data Race');
    });

    test('should display the header text', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('h1')).toHaveText('Python Data Race');
      await expect(page.locator('.subtitle')).toHaveText('Who processes 1M rows fastest?');
    });

    test('should show START RACE button as visible and enabled', async ({ page }) => {
      await page.goto('/');
      const startBtn = page.getByTestId('start-button');
      await expect(startBtn).toBeVisible();
      await expect(startBtn).toBeEnabled();
      await expect(startBtn).toHaveText('START RACE');
    });

    test('should show race track canvas', async ({ page }) => {
      await page.goto('/');
      const canvas = page.getByTestId('race-canvas');
      await expect(canvas).toBeVisible();
    });

    test('should show leaderboard with all 4 runners', async ({ page }) => {
      await page.goto('/');
      const leaderboard = page.getByTestId('leaderboard');
      await expect(leaderboard).toBeVisible();

      // Verify all 4 runner names appear
      await expect(leaderboard.getByText('Pure Python')).toBeVisible();
      await expect(leaderboard.getByText('Pandas')).toBeVisible();
      await expect(leaderboard.getByText('Polars')).toBeVisible();
      await expect(leaderboard.getByText('DuckDB')).toBeVisible();
    });

    test('should show memory bars panel', async ({ page }) => {
      await page.goto('/');
      const memoryBars = page.getByTestId('memory-bars');
      await expect(memoryBars).toBeVisible();
      await expect(memoryBars.getByText('Memory Usage')).toBeVisible();
    });
  });

  test.describe('Countdown', () => {
    test('should show countdown 3, 2, 1 after clicking START', async ({ page }) => {
      await page.goto('/');

      const startBtn = page.getByTestId('start-button');
      await startBtn.click();

      const countdown = page.getByTestId('countdown');

      // Should show "3" first
      await expect(countdown).toHaveText('3');

      // Should count down to "2"
      await expect(countdown).toHaveText('2', { timeout: 2000 });

      // Should count down to "1"
      await expect(countdown).toHaveText('1', { timeout: 2000 });

      // Should show "GO!" briefly
      await expect(countdown).toHaveText('GO!', { timeout: 2000 });
    });

    test('should disable starting another race during countdown', async ({ page }) => {
      await page.goto('/');

      const startBtn = page.getByTestId('start-button');
      await startBtn.click();

      // During countdown, the start button should not be visible (replaced by countdown)
      await expect(startBtn).not.toBeVisible();
      const countdown = page.getByTestId('countdown');
      await expect(countdown).toBeVisible();
    });
  });

  test.describe('Race Execution', () => {
    // Helper: start race and wait past the countdown
    async function startRaceAndWaitForCountdown(page: Page) {
      await page.goto('/');
      const startBtn = page.getByTestId('start-button');
      await startBtn.click();
      // Wait for countdown to finish (3 * 700ms + 400ms GO = ~2500ms)
      // The countdown element disappears when it's done
      await expect(page.getByTestId('countdown')).not.toBeVisible({ timeout: 5000 });
    }

    test('should show race in progress after countdown', async ({ page }) => {
      await startRaceAndWaitForCountdown(page);

      // The start button should now be disabled (showing during race)
      const startBtn = page.getByTestId('start-button');
      await expect(startBtn).toBeDisabled({ timeout: 3000 });
    });

    test('should update memory bars during race', async ({ page }) => {
      await startRaceAndWaitForCountdown(page);

      const memoryBars = page.getByTestId('memory-bars');

      // Wait for at least one runner to show non-zero memory
      await expect(async () => {
        const memoryValues = await memoryBars.locator('.memory-value').allTextContents();
        const hasNonZero = memoryValues.some((v) => {
          const num = parseFloat(v);
          return !isNaN(num) && num > 0;
        });
        expect(hasNonZero).toBe(true);
      }).toPass({ timeout: 30_000 });
    });

    test('should show stage progress during race', async ({ page }) => {
      await startRaceAndWaitForCountdown(page);

      // Wait for at least one stage checkmark to appear
      await expect(async () => {
        const doneMarkers = await page.locator('.stage-done').count();
        expect(doneMarkers).toBeGreaterThan(0);
      }).toPass({ timeout: 30_000 });
    });

    test('should show all 4 runners finishing eventually', async ({ page }) => {
      await startRaceAndWaitForCountdown(page);

      const leaderboard = page.getByTestId('leaderboard');

      // Wait for all 4 runners to show a time (not "-")
      await expect(async () => {
        const timeCells = await leaderboard.locator('td.mono').allTextContents();
        // Filter for time cells (contain "s" for seconds)
        const completedTimes = timeCells.filter((t) => t.includes('s'));
        expect(completedTimes.length).toBeGreaterThanOrEqual(4);
      }).toPass({ timeout: 90_000 });
    });

    test('should show "View Detailed Results" button after all finish', async ({ page }) => {
      await startRaceAndWaitForCountdown(page);

      // Wait for the results button to appear (all runners finished)
      const resultsBtn = page.getByTestId('view-results-btn');
      await expect(resultsBtn).toBeVisible({ timeout: 90_000 });
      await expect(resultsBtn).toHaveText('View Detailed Results');
    });

    test('should show "RACE AGAIN" button after race finishes', async ({ page }) => {
      await startRaceAndWaitForCountdown(page);

      // Wait for the race to finish and the start button to reappear
      const startBtn = page.getByTestId('start-button');
      await expect(startBtn).toBeVisible({ timeout: 90_000 });
      await expect(startBtn).toHaveText('RACE AGAIN');
      await expect(startBtn).toBeEnabled();
    });
  });

  test.describe('Results Modal', () => {
    async function runFullRace(page: Page) {
      await page.goto('/');
      const startBtn = page.getByTestId('start-button');
      await startBtn.click();

      // Wait for the results button to appear
      const resultsBtn = page.getByTestId('view-results-btn');
      await expect(resultsBtn).toBeVisible({ timeout: 95_000 });
    }

    test('should open results modal when clicking "View Detailed Results"', async ({ page }) => {
      await runFullRace(page);

      const resultsBtn = page.getByTestId('view-results-btn');
      await resultsBtn.click();

      const modal = page.getByTestId('results-modal');
      await expect(modal).toBeVisible();
      await expect(modal.locator('.modal-title')).toHaveText('Race Results');
    });

    test('should show winner in results modal', async ({ page }) => {
      await runFullRace(page);

      const resultsBtn = page.getByTestId('view-results-btn');
      await resultsBtn.click();

      const modal = page.getByTestId('results-modal');
      // The modal subtitle should contain "Winner:"
      await expect(modal.locator('.modal-subtitle')).toContainText('Winner:');
    });

    test('should show all 4 runners in results table', async ({ page }) => {
      await runFullRace(page);

      const resultsBtn = page.getByTestId('view-results-btn');
      await resultsBtn.click();

      const modal = page.getByTestId('results-modal');
      const rows = modal.locator('.results-table tbody tr');
      await expect(rows).toHaveCount(4);
    });

    test('should show "What happened?" section with explanations', async ({ page }) => {
      await runFullRace(page);

      const resultsBtn = page.getByTestId('view-results-btn');
      await resultsBtn.click();

      const modal = page.getByTestId('results-modal');
      await expect(modal.getByText('What happened?')).toBeVisible();

      // Should have 4 note cards (one per runner)
      const noteCards = modal.locator('.note-card');
      await expect(noteCards).toHaveCount(4);
    });

    test('should close results modal when clicking close button', async ({ page }) => {
      await runFullRace(page);

      const resultsBtn = page.getByTestId('view-results-btn');
      await resultsBtn.click();

      const modal = page.getByTestId('results-modal');
      await expect(modal).toBeVisible();

      // Click the X button
      await modal.locator('.modal-close').click();
      await expect(modal).not.toBeVisible();
    });

    test('should close results modal when clicking overlay', async ({ page }) => {
      await runFullRace(page);

      const resultsBtn = page.getByTestId('view-results-btn');
      await resultsBtn.click();

      const modal = page.getByTestId('results-modal');
      await expect(modal).toBeVisible();

      // Click the overlay (outside the modal)
      await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } });
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('Edge Cases', () => {
    test('should prevent starting race while already racing (API guard)', async ({ page }) => {
      await page.goto('/');

      const startBtn = page.getByTestId('start-button');
      await startBtn.click();

      // Wait for countdown to finish and race to start
      await expect(page.getByTestId('countdown')).not.toBeVisible({ timeout: 5000 });

      // The start button should be disabled during the race
      await expect(page.getByTestId('start-button')).toBeDisabled({ timeout: 3000 });
    });

    test('should be able to start a second race after first completes', async ({ page }) => {
      await page.goto('/');

      // First race
      const startBtn = page.getByTestId('start-button');
      await startBtn.click();

      // Wait for race to finish
      await expect(startBtn).toBeVisible({ timeout: 95_000 });
      await expect(startBtn).toHaveText('RACE AGAIN');

      // Start second race
      await startBtn.click();

      // Countdown should appear again
      const countdown = page.getByTestId('countdown');
      await expect(countdown).toHaveText('3');
    });
  });
});
