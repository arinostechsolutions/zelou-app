import axiosInstance from './axios';

export interface StatisticsOverview {
  totalUsers: number;
  totalCondominiums: number;
  totalDeliveries: number;
  totalReports: number;
  totalReservations: number;
  totalAnnouncements: number;
  totalVisitors: number;
  totalMaintenances: number;
}

export interface UsersByCondominium {
  condominiumId: string;
  condominiumName: string;
  totalUsers: number;
  roles: {
    morador: number;
    porteiro: number;
    zelador: number;
    sindico: number;
    master: number;
  };
}

export interface UsersByRole {
  role: string;
  count: number;
}

export interface RecentActivity {
  deliveries: number;
  reports: number;
  reservations: number;
  users: number;
}

export interface StatisticsResponse {
  overview: StatisticsOverview;
  usersByCondominium: UsersByCondominium[];
  usersByRole: UsersByRole[];
  deliveriesByStatus: Record<string, number>;
  reservationsByStatus: Record<string, number>;
  reportsByStatus: Record<string, number>;
  maintenancesByStatus: Record<string, number>;
  recentActivity: RecentActivity;
}

export const statisticsApi = {
  getAll: async (condominiumId?: string): Promise<StatisticsResponse> => {
    const params = condominiumId ? { condominiumId } : {};
    const response = await axiosInstance.get<StatisticsResponse>('/statistics', { params });
    return response.data;
  },
};

