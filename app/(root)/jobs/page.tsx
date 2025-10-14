"use client";

import { use, useEffect, useState } from "react";
import JobCard from "@/components/cards/JobCard";
import JobsFilter from "@/components/filters/JobFilter";
import Pagination from "@/components/Pagination";
import { fetchCountries, fetchJobs, fetchLocation } from "@/lib/actions/job.action";

interface RouteParams {
  searchParams: Promise<{
    query?: string;
    location?: string;
    page?: string;
  }>;
}

const page = ({ searchParams }: RouteParams) => {
  // ✅ unwrap searchParams safely
  const { query, location, page } = use(searchParams);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  const parsedPage = parseInt(page ?? "1");

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);

      try {
        
        const cacheKey = `cachedJobs_${query || "default"}_${location || "global"}_${parsedPage}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const now = Date.now();

        
          if (now - timestamp < 24 * 60 * 60 * 1000) {
            setJobs(data);
            setLoading(false);
            return;
          }
        }

        const userLocation = await fetchLocation();

        const fetchedJobs = await fetchJobs({
          query: `${query}, ${location}` || `Software Engineer in ${userLocation}`,
          page: parsedPage.toString(),
        });

        setJobs(fetchedJobs);

        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: fetchedJobs,
            timestamp: Date.now(),
          })
        );
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    const loadCountries = async () => {
      const c = await fetchCountries();
      setCountries(c);
    };

    loadJobs();
    loadCountries();
  }, [query, location, page]);

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">Jobs</h1>

      <div className="flex">
        <JobsFilter countriesList={countries} />
      </div>

      {loading ? (
        <div className="text-center text-dark200_light800 mt-10">Loading jobs...</div>
      ) : (
        <section className="light-border mb-9 mt-11 flex flex-col gap-9 border-b pb-9">
          {jobs?.length > 0 ? (
            jobs
              ?.filter((job: Job) => job.job_title)
              .map((job: Job) => <JobCard key={job.job_title} job={job} />)
          ) : (
            <div className="paragraph-regular text-dark200_light800 w-full text-center">
              Oops! We couldn&apos;t find any jobs at the moment. Please try again later.
            </div>
          )}
        </section>
      )}

      {!loading && jobs?.length > 0 && (
        <Pagination page={parsedPage} isNext={jobs?.length === 10} />
      )}
    </>
  );
};

export default page;
