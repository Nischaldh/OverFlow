import { countriesList } from "@/constants";
import { JobFilterParams } from "@/types/action";

export const fetchLocation = async () => {
  const response = await fetch("https://ip-api.com/json/?fields=country");
  const location = await response.json();
  return location.country;
};


export const fetchJobs = async (filters: JobFilterParams) => {
  const { query, page } = filters;

  const headers = {
    "X-RapidAPI-Key": process.env.NEXT_PUBLIC_RAPID_API_KEY ?? "",
    "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
  };

  const response = await fetch(
    `https://jsearch.p.rapidapi.com/search?query=${query}&page=${page}`,
    {
      headers,
    }
  );

  const result = await response.json();

  return result.data;
};




export const fetchCountries = async (): Promise<Country[]> => {
  return countriesList;
};