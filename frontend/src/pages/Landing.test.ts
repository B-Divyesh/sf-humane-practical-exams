import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import Landing from './Landing.svelte';

describe('landing page', () => {
  afterEach(cleanup);

  it('has one clear page heading and the primary action', () => {
    render(Landing);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/See the work\.\s*Respect the person\./);
    expect(screen.getAllByRole('link', { name: /create an exam/i }).length).toBeGreaterThan(0);
  });

  it('states the non-surveillance boundary', () => {
    render(Landing);
    expect(screen.getByText('No webcam or room recording')).toBeInTheDocument();
    expect(screen.getByText('This tool is not “cheat-proof.” It helps assessors make a defensible judgement from visible work.')).toBeInTheDocument();
  });
});
