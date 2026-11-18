import { prisma } from '../../db/prisma';
import { ScrapedProperty } from './types';

export class PropertyDatabaseService {
  /**
   * Upsert a single scraped property listing without creating duplicate entries.
   * Keyed on `externalId` and `sourceUrl` in PostgreSQL.
   */
  static async upsertScrapedProperty(property: ScrapedProperty): Promise<{ success: boolean; isNew: boolean; error?: string }> {
    try {
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL not configured for PostgreSQL');
      }

      const existing = await prisma.property.findUnique({
        where: { externalId: property.externalId },
      });

      const isNew = !existing;

      await prisma.property.upsert({
        where: { externalId: property.externalId },
        create: {
          externalId: property.externalId,
          sourcePortal: PropertyDatabaseService.extractPortalName(property.sourceUrl),
          sourceUrl: property.sourceUrl,
          title: property.title,
          description: property.description || '',
          propertyType: property.propertyType,
          listingType: property.listingType,
          price: property.price,
          currency: property.currency,
          carpetAreaSqFt: property.carpetAreaSqFt,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          furnishingStatus: property.furnishingStatus,
          address: property.location.address,
          locality: property.location.locality,
          city: property.location.city,
          latitude: property.location.latitude,
          longitude: property.location.longitude,
          amenities: property.amenities,
          images: property.images,
          scrapedAt: property.scrapedAt,
        },
        update: {
          title: property.title,
          description: property.description || '',
          price: property.price,
          currency: property.currency,
          carpetAreaSqFt: property.carpetAreaSqFt,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          furnishingStatus: property.furnishingStatus,
          address: property.location.address,
          locality: property.location.locality,
          city: property.location.city,
          latitude: property.location.latitude,
          longitude: property.location.longitude,
          amenities: property.amenities,
          images: property.images,
          scrapedAt: property.scrapedAt,
          updatedAt: new Date(),
        },
      });

      return { success: true, isNew };
    } catch (err: any) {
      return {
        success: false,
        isNew: false,
        error: `PostgreSQL upsert error: ${err.message || err}`,
      };
    }
  }

  /**
   * Bulk upsert an array of scraped property listings directly into PostgreSQL
   */
  static async bulkUpsertScrapedProperties(properties: ScrapedProperty[]): Promise<{
    processed: number;
    saved: number;
    newCount: number;
    updatedCount: number;
    errors: string[];
  }> {
    let saved = 0;
    let newCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (const prop of properties) {
      const res = await PropertyDatabaseService.upsertScrapedProperty(prop);
      if (res.success) {
        saved++;
        if (res.isNew) newCount++;
        else updatedCount++;
      } else if (res.error) {
        errors.push(`Failed for externalId ${prop.externalId}: ${res.error}`);
      }
    }

    return {
      processed: properties.length,
      saved,
      newCount,
      updatedCount,
      errors,
    };
  }

  /**
   * Retrieve all stored properties directly from PostgreSQL
   */
  static async getAllProperties(): Promise<ScrapedProperty[]> {
    const dbProps = await prisma.property.findMany({
      orderBy: { scrapedAt: 'desc' },
    });

    return dbProps.map((p) => ({
      externalId: p.externalId,
      title: p.title,
      description: p.description || undefined,
      propertyType: p.propertyType as any,
      listingType: p.listingType as any,
      price: p.price,
      currency: p.currency,
      carpetAreaSqFt: p.carpetAreaSqFt,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      furnishingStatus: (p.furnishingStatus as any) || undefined,
      location: {
        address: p.address,
        locality: p.locality,
        city: p.city,
        latitude: p.latitude || undefined,
        longitude: p.longitude || undefined,
      },
      amenities: p.amenities,
      images: p.images,
      sourceUrl: p.sourceUrl,
      scrapedAt: p.scrapedAt,
    }));
  }

  /**
   * Utility to extract portal name from source URL domain
   */
  private static extractPortalName(sourceUrl: string): string {
    try {
      const hostname = new URL(sourceUrl).hostname.toLowerCase();
      if (hostname.includes('99acres')) return '99acres';
      if (hostname.includes('housing')) return 'Housing.com';
      if (hostname.includes('magicbricks')) return 'MagicBricks';
      if (hostname.includes('realtor')) return 'Realtor.com';
      if (hostname.includes('zillow')) return 'Zillow';
      return hostname;
    } catch {
      return 'UNKNOWN';
    }
  }
}
