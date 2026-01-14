import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTenantBranding } from '../services/tenantService';

interface TenantBranding {
  brandName: string;
  logoUrl: string;
  isLoading: boolean;
}

/**
 * Custom hook to get tenant branding information
 * Automatically fetches branding based on current user's tenantId
 * Falls back to default Kydo Solutions branding if no custom branding is set
 */
export const useTenantBranding = (): TenantBranding => {
  const { user, currentTenant, availableTenants } = useAuth();
  const [branding, setBranding] = useState<TenantBranding>({
    brandName: 'Kydo Solutions',
    logoUrl: '/kydoicon.png',
    isLoading: true
  });

  useEffect(() => {
    const fetchBranding = async () => {
      setBranding(prev => ({ ...prev, isLoading: true }));
      
      try {
        // Use currentTenant for multi-tenant admins, fallback to user.tenantId
        const isMultiTenantAdmin = user?.role === 'Admin' && availableTenants.length > 1;
        const effectiveTenantId = isMultiTenantAdmin && currentTenant?.id ? currentTenant.id : user?.tenantId;
        
        const tenantBranding = await getTenantBranding(effectiveTenantId);
        setBranding({
          brandName: tenantBranding.brandName,
          logoUrl: tenantBranding.logoUrl,
          isLoading: false
        });
      } catch (error) {
        setBranding({
          brandName: 'Kydo Solutions',
          logoUrl: '/kydoicon.png',
          isLoading: false
        });
      }
    };

    fetchBranding();
  }, [user?.tenantId, currentTenant?.id, availableTenants.length]);

  return branding;
};
