import { supabase } from '../lib/supabase';
import type { School } from '../types/tenant';

export class TenantService {
  private static resolveSubdomain(): string | null {
    if (typeof window === 'undefined') return null;

    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname.startsWith('192.168') || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return 'demo-school';
    }

    if (hostname === 'www.educrm.app' || hostname === 'educrm.app') {
      return null;
    }

    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[0];
    }

    return null;
  }

  static async getSchoolBySlug(slug: string): Promise<School | null> {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching school:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getSchoolBySlug:', error);
      return null;
    }
  }

  static async resolveCurrentTenant(): Promise<School | null> {
    const subdomain = this.resolveSubdomain();

    if (!subdomain) {
      return null;
    }

    return this.getSchoolBySlug(subdomain);
  }

  static validateTenantBoundary(userSchoolId: string, tenantSchoolId: string): boolean {
    if (userSchoolId !== tenantSchoolId) {
      console.error('Tenant boundary violation detected', {
        userSchoolId,
        tenantSchoolId,
      });
      return false;
    }
    return true;
  }

  static applyBranding(school: School): void {
    if (!school.branding) return;

    const root = document.documentElement;

    if (school.branding.colors) {
      root.style.setProperty('--color-primary', school.branding.colors.primary);
      root.style.setProperty('--color-secondary', school.branding.colors.secondary);
      root.style.setProperty('--color-accent', school.branding.colors.accent);

      if (school.branding.colors.text_primary) {
        root.style.setProperty('--color-text-primary', school.branding.colors.text_primary);
      }
      if (school.branding.colors.text_secondary) {
        root.style.setProperty('--color-text-secondary', school.branding.colors.text_secondary);
      }
      if (school.branding.colors.background) {
        root.style.setProperty('--color-background', school.branding.colors.background);
      }
      if (school.branding.colors.surface) {
        root.style.setProperty('--color-surface', school.branding.colors.surface);
      }
    }

    if (school.branding.typography) {
      root.style.setProperty('--font-family', school.branding.typography.font_family);
      if (school.branding.typography.heading_font) {
        root.style.setProperty('--font-heading', school.branding.typography.heading_font);
      }
    }

    if (school.branding.theme?.border_radius) {
      root.style.setProperty('--border-radius', school.branding.theme.border_radius);
    }

    if (school.branding.favicon?.url) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = school.branding.favicon.url;
      }
    }

    document.title = `${school.name} - Education CRM`;

    if (school.branding.custom_css) {
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = school.branding.custom_css;
      document.head.appendChild(linkElement);
    }
  }
}
