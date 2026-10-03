import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { votingService, Voting, VotingKandidat } from '@/services/voting.service';

export function useVotingList(token: string) {
  return useQuery({
    queryKey: ['adminVotingList'],
    queryFn: () => votingService.getAdminVotingList(token),
    enabled: !!token,
  });
}

export function useVotingDetail(token: string, id: string) {
  return useQuery({
    queryKey: ['adminVotingDetail', id],
    queryFn: () => votingService.getAdminVotingDetail(token, id),
    enabled: !!token && !!id,
  });
}

export function useSaveVoting(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: Partial<Voting> }) => {
      if (id) return votingService.updateVoting(token, id, data);
      return votingService.createVoting(token, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminVotingList'] });
    },
  });
}

export function useDeleteVoting(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => votingService.deleteVoting(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminVotingList'] });
    },
  });
}

export function useSaveKandidat(token: string, votingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: Partial<VotingKandidat> }) => {
      if (id) return votingService.updateKandidat(token, id, data);
      return votingService.addKandidat(token, votingId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminVotingDetail', votingId] });
    },
  });
}

export function useDeleteKandidat(token: string, votingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (kandidatId: string) => votingService.deleteKandidat(token, votingId, kandidatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminVotingDetail', votingId] });
    },
  });
}

// ========================
// PUBLIC HOOKS
// ========================

export function usePublicVotingList() {
  return useQuery({
    queryKey: ['publicVotingList'],
    queryFn: () => votingService.getPublicVotingList(),
  });
}

export function usePublicVotingDetail(id: string) {
  return useQuery({
    queryKey: ['publicVotingDetail', id],
    queryFn: () => votingService.getPublicVotingDetail(id),
    enabled: !!id,
    refetchInterval: 10000, // polling live results every 10s if needed
  });
}

export function useCastVote() {
  return useMutation({
    mutationFn: ({ votingId, kandidatId, nik }: { votingId: string; kandidatId: string; nik: string }) => {
      return votingService.castVote(votingId, kandidatId, nik);
    },
  });
}
