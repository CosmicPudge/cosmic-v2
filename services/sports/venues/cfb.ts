export interface CollegeFootballVenueRecord {
  schoolId?: string;
  teamId?: string;
  venueId: string;
  canonicalName: string;
  city: string;
  state: string;
  aliases: string[];
  conference?: string;
  neutralSite?: boolean;
  imagePath?: string;
}

/** Extensible registry for FBS/FCS, neutral sites, bowls, and playoff venues. */
export const COLLEGE_FOOTBALL_VENUES: CollegeFootballVenueRecord[] = [];
