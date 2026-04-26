import { render, screen, waitFor } from '@testing-library/react';
import { VendorDashboard } from '@/routes/_app.vendedor';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';

describe('VendorDashboard', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockClear();
  });

  it('renders the seller registration form when profile is missing', async () => {
    // Mock profile as null
    (supabase.from as any).mockImplementation((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    }));

    render(<VendorDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Torne-se um Vendedor/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Ex: Cooperativa Sertão Vivo/i)).toBeInTheDocument();
    });
  });

  it('renders dashboard blocks when seller profile exists', async () => {
    // Mock profile
    const mockProfile = { id: 'seller-1', store_name: 'Minha Loja', approved: true };
    const mockWallet = { balance: 100 };
    
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'sellers') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        };
      }
      if (table === 'products') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === 'seller_wallet') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: mockWallet, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    render(<VendorDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Resumo do mês/i)).toBeInTheDocument();
      expect(screen.getByText(/Vendas Líquidas/i)).toBeInTheDocument();
      expect(screen.getByText(/Saldo Disponível/i)).toBeInTheDocument();
      expect(screen.getByText(/Minha Loja/i)).toBeInTheDocument();
    });
  });
});
