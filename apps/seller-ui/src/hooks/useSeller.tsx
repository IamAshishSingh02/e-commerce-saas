import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axios-instance";

//  Fetch user data form API
const fetchSeller = async() => {
  const response = await axiosInstance.get('/api/logged-in-seller')
  return response.data.seller
}

const useSeller = () => {
  const {
    data: seller,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['seller'],
    queryFn: fetchSeller,
    staleTime: 5 * 60 * 1000,
    retry: 1
  })
  return {seller, isLoading, isError, refetch}
}

export default useSeller