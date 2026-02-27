'use server';

import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { MAX_PARTY_SIZE, MAX_DATES_OF_INTEREST } from '@/lib/types';

type Input = {
  experience_id: string;
  party_size: number;
  dates_of_interest: string[];
  session_id?: string;
  email?: string;
  name?: string;
};

export async function submitInterest(input: Input): Promise<{ success: boolean; error?: string }> {
  if (!input.experience_id || input.party_size == null || !Array.isArray(input.dates_of_interest)) {
    return { success: false, error: 'invalid' };
  }
  if (input.party_size < 1 || input.party_size > MAX_PARTY_SIZE) {
    return { success: false, error: 'invalid_party_size' };
  }
  const dates = input.dates_of_interest
    .filter((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.trim()))
    .slice(0, MAX_DATES_OF_INTEREST);
  if (dates.length === 0) {
    return { success: false, error: 'invalid_dates' };
  }

  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const identifier = input.session_id || ip;

  return db.addInterest(
    {
      experience_id: input.experience_id,
      party_size: input.party_size,
      dates_of_interest: dates,
      session_id: input.session_id || null,
      email: input.email || null,
      name: input.name || null,
    },
    identifier
  );
}
