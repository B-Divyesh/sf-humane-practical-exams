import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import Landing from './Landing.svelte';

describe('landing page', () => {
  afterEach(cleanup);

  it('has one clear page heading and the primary action', () => {
    render(Landing);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Run practical exams without surveillance');
    expect(screen.getByRole('link', { name: /try it with sample data/i })).toBeInTheDocument();
  });

  it('states the non-surveillance boundary', () => {
    render(Landing);
    expect(screen.getByText('Webcam or room recordings')).toBeInTheDocument();
    expect(screen.getByText(/does not prove who completed the work/)).toBeInTheDocument();
  });

  it('does not advertise a broken checkout action', () => {
    render(Landing);
    expect(screen.queryByRole('link', { name: /buy provider tools/i })).not.toBeInTheDocument();
    expect(screen.getByText(/New provider tool purchases are temporarily unavailable/)).toBeInTheDocument();
  });
});
