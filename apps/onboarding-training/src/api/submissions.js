import { useMutation } from '@tanstack/react-query';
import { apiClient } from './client';

export function useSubmitForm() {
  return useMutation({
    mutationFn: async (formData) => {
      const endpoint = import.meta.env.VITE_SUBMISSION_ENDPOINT || '/api/submit';
      const { data } = await apiClient.post(endpoint, formData);
      return data;
    },
  });
}

export function useUploadInventoryPhoto() {
  return useMutation({
    mutationFn: async ({ levelId, photo }) => {
      const endpoint = import.meta.env.VITE_INVENTORY_ENDPOINT || '/api/inventory';
      const fd = new FormData();
      fd.append('levelId', levelId);
      fd.append('photo', photo);
      const { data } = await apiClient.post(endpoint, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
  });
}

export function useVerifyAccess() {
  return useMutation({
    mutationFn: async (payload) => {
      const endpoint = import.meta.env.VITE_VERIFICATION_ENDPOINT || '/api/verify-access';
      const { data } = await apiClient.post(endpoint, payload);
      return data;
    },
  });
}
