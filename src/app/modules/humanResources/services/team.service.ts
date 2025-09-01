import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { Team } from '../models/team';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private http = inject(HttpClient);

  getTeams(): Observable<ApiResponse<Team[]>> {
    return this.http.get<ApiResponse<Team[]>>(API_ROUTES.HR.TEAMS);
  }

  getTeam(id: number): Observable<ApiResponse<Team>> {
    return this.http.get<ApiResponse<Team>>(`${API_ROUTES.HR.TEAMS}/${id}`);
  }

  createTeam(team: Partial<Team>): Observable<ApiResponse<Team>> {
    return this.http.post<ApiResponse<Team>>(API_ROUTES.HR.TEAMS, team);
  }

  updateTeam(id: number, team: Partial<Team>): Observable<ApiResponse<Team>> {
    return this.http.put<ApiResponse<Team>>(`${API_ROUTES.HR.TEAMS}/${id}`, team);
  }

  deleteTeam(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API_ROUTES.HR.TEAMS}/${id}`);
  }

  toggleStatus(id: number): Observable<ApiResponse<Team>> {
    return this.http.patch<ApiResponse<Team>>(`${API_ROUTES.HR.TEAMS}/${id}/toggle-status`, {});
  }

  getTeamMembers(id: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${API_ROUTES.HR.TEAMS}/${id}/members`);
  }

  assignLeader(teamId: number, leaderId: number): Observable<ApiResponse<Team>> {
    return this.http.patch<ApiResponse<Team>>(`${API_ROUTES.HR.TEAMS}/${teamId}/assign-leader`, {
      team_leader_id: leaderId
    });
  }
}