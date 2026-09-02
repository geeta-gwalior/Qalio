"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export type FilterState = {
  employmentType: {
    fullTime: boolean;
    partTime: boolean;
  };
  locations: {
    indore: boolean;
    bhopal: boolean;
    mumbai: boolean;
    delhi: boolean;
    pune: boolean;
  };
  seniorityLevel: {
    entry: boolean;
    medium: boolean;
    senior: boolean;
  };
  salaryRange: number[];
};

type JobFiltersProps = {
  filters: FilterState;
  searchQuery: string;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: FilterState) => void;
};

export default function JobFilters({
  filters,
  searchQuery,
  showFilters,
  setShowFilters,
  setSearchQuery,
  setFilters,
}: JobFiltersProps) {
  const filterRef = useRef<HTMLDivElement | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null); // Add ref for filter button
  const router = useRouter();

  // State for collapsible sections
  const [collapsedSections, setCollapsedSections] = useState({
    employmentType: false,
    salaryRange: false,
    locations: false,
    seniorityLevel: false,
  });

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleEmploymentTypeChange = (type: "fullTime" | "partTime") => {
    setFilters({
      ...filters,
      employmentType: {
        ...filters.employmentType,
        [type]: !filters.employmentType[type],
      },
    });
  };

  const handleLocationChange = (location: string) => {
    setFilters({
      ...filters,
      locations: {
        ...filters.locations,
        [location]:
          !filters.locations[location as keyof typeof filters.locations],
      },
    });
  };

  const handleSeniorityLevelChange = (level: string) => {
    setFilters({
      ...filters,
      seniorityLevel: {
        ...filters.seniorityLevel,
        [level]:
          !filters.seniorityLevel[level as keyof typeof filters.seniorityLevel],
      },
    });
  };

  const handleSalaryRangeChange = (value: number[]) => {
    setFilters({
      ...filters,
      salaryRange: value,
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showFilters) {
        setShowFilters(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      // Check if click is outside both the filter overlay AND the filter button
      if (
        filterRef.current &&
        !filterRef.current.contains(e.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(e.target as Node)
      ) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      window.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilters, setShowFilters]);

  return (
    <>
      <div className="flex flex-col justify-end sm:justify-end sm:items-center gap-3 mb-3 relative">
        <div className="flex flex-row flex-wrap items-center gap-2 py-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search..."
              className="w-full bg-white pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>

          <Button
            ref={filterButtonRef} // Add ref to the button
            variant="ghost"
            className="p-0 m-0 sm: bg-white border-none shadow-none hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setShowFilters(!showFilters);
            }}
          >
            <svg
              width="16"
              height="18"
              viewBox="0 0 16 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gray-700"
            >
              <path
                d="M4.99864 2.00191C4.73349 2.00191 4.47921 2.10723 4.29172 2.29472C4.10424 2.4822 3.99891 2.73649 3.99891 3.00163C3.99891 3.26678 4.10424 3.52106 4.29172 3.70855C4.47921 3.89603 4.73349 4.00136 4.99864 4.00136C5.26378 4.00136 5.51807 3.89603 5.70555 3.70855C5.89304 3.52106 5.99837 3.26678 5.99837 3.00163C5.99837 2.73649 5.89304 2.4822 5.70555 2.29472C5.51807 2.10723 5.26378 2.00191 4.99864 2.00191ZM2.16941 2.00191C2.37595 1.41653 2.75899 0.909636 3.26571 0.55109C3.77243 0.192543 4.37789 0 4.99864 0C5.61938 0 6.22484 0.192543 6.73157 0.55109C7.23829 0.909636 7.62132 1.41653 7.82787 2.00191H14.9959C15.2611 2.00191 15.5153 2.10723 15.7028 2.29472C15.8903 2.4822 15.9956 2.73649 15.9956 3.00163C15.9956 3.26678 15.8903 3.52106 15.7028 3.70855C15.5153 3.89603 15.2611 4.00136 14.9959 4.00136H7.82787C7.62132 4.58673 7.23829 5.09363 6.73157 5.45218C6.22484 5.81072 5.61938 6.00327 4.99864 6.00327C4.37789 6.00327 3.77243 5.81072 3.26571 5.45218C2.75899 5.09363 2.37595 4.58673 2.16941 4.00136H0.999728C0.734583 4.00136 0.480299 3.89603 0.292814 3.70855C0.105328 3.52106 0 3.26678 0 3.00163C0 2.73649 0.105328 2.4822 0.292814 2.29472C0.480299 2.10723 0.734583 2.00191 0.999728 2.00191H2.16941ZM10.997 8.00027C10.7319 8.00027 10.4776 8.1056 10.2901 8.29309C10.1026 8.48057 9.99728 8.73486 9.99728 9C9.99728 9.26514 10.1026 9.51943 10.2901 9.70691C10.4776 9.8944 10.7319 9.99973 10.997 9.99973C11.2621 9.99973 11.5164 9.8944 11.7039 9.70691C11.8914 9.51943 11.9967 9.26514 11.9967 9C11.9967 8.73486 11.8914 8.48057 11.7039 8.29309C11.5164 8.1056 11.2621 8.00027 10.997 8.00027ZM8.16777 8.00027C8.37432 7.4149 8.75735 6.908 9.26408 6.54946C9.7708 6.19091 10.3763 5.99837 10.997 5.99837C11.6177 5.99837 12.2232 6.19091 12.7299 6.54946C13.2367 6.908 13.6197 7.4149 13.8262 8.00027H14.9959C15.2611 8.00027 15.5153 8.1056 15.7028 8.29309C15.8903 8.48057 15.9956 8.73486 15.9956 9C15.9956 9.26514 15.8903 9.51943 15.7028 9.70691C15.5153 9.8944 15.2611 9.99973 14.9959 9.99973H13.8262C13.6197 10.5851 13.2367 11.092 12.7299 11.4505C12.2232 11.8091 11.6177 12.0016 10.997 12.0016C10.3763 12.0016 9.7708 11.8091 9.26408 11.4505C8.75735 11.092 8.37432 10.5851 8.16777 9.99973H0.999728C0.734583 9.99973 0.480299 9.8944 0.292814 9.70691C0.105328 9.51943 0 9.26514 0 9C0 8.73486 0.105328 8.48057 0.292814 8.29309C0.480299 8.1056 0.734583 8.00027 0.999728 8.00027H8.16777ZM4.99864 13.9986C4.73349 13.9986 4.47921 14.104 4.29172 14.2915C4.10424 14.4789 3.99891 14.7332 3.99891 14.9984C3.99891 15.2635 4.10424 15.5178 4.29172 15.7053C4.47921 15.8928 4.73349 15.9981 4.99864 15.9981C5.26378 15.9981 5.51807 15.8928 5.70555 15.7053C5.89304 15.5178 5.99837 15.2635 5.99837 14.9984C5.99837 14.7332 5.89304 14.4789 5.70555 14.2915C5.51807 14.104 5.26378 13.9986 4.99864 13.9986ZM2.16941 13.9986C2.37595 13.4133 2.75899 12.9064 3.26571 12.5478C3.77243 12.1893 4.37789 11.9967 4.99864 11.9967C5.61938 11.9967 6.22484 12.1893 6.73157 12.5478C7.23829 12.9064 7.62132 13.4133 7.82787 13.9986H14.9959C15.2611 13.9986 15.5153 14.104 15.7028 14.2915C15.8903 14.4789 15.9956 14.7332 15.9956 14.9984C15.9956 15.2635 15.8903 15.5178 15.7028 15.7053C15.5153 15.8928 15.2611 15.9981 14.9959 15.9981H7.82787C7.62132 16.5835 7.23829 17.0904 6.73157 17.4489C6.22484 17.8075 5.61938 18 4.99864 18C4.37789 18 3.77243 17.8075 3.26571 17.4489C2.75899 17.0904 2.37595 16.5835 2.16941 15.9981H0.999728C0.734583 15.9981 0.480299 15.8928 0.292814 15.7053C0.105328 15.5178 0 15.2635 0 14.9984C0 14.7332 0.105328 14.4789 0.292814 14.2915C0.480299 14.104 0.734583 13.9986 0.999728 13.9986H2.16941ZM10.997 8.00027C10.7319 8.00027 10.4776 8.1056 10.2901 8.29309C10.1026 8.48057 9.99728 8.73486 9.99728 9C9.99728 9.26514 10.1026 9.51943 10.2901 9.70691C10.4776 9.8944 10.7319 9.99973 10.997 9.99973C11.2621 9.99973 11.5164 9.8944 11.7039 9.70691C11.8914 9.51943 11.9967 9.26514 11.9967 9C11.9967 8.73486 11.8914 8.48057 11.7039 8.29309C11.5164 8.1056 11.2621 8.00027 10.997 8.00027ZM8.16777 8.00027C8.37432 7.4149 8.75735 6.908 9.26408 6.54946C9.7708 6.19091 10.3763 5.99837 10.997 5.99837C11.6177 5.99837 12.2232 6.19091 12.7299 6.54946C13.2367 6.908 13.6197 7.4149 13.8262 8.00027H14.9959C15.2611 8.00027 15.5153 8.1056 15.7028 8.29309C15.8903 8.48057 15.9956 8.73486 15.9956 9C15.9956 9.26514 15.8903 9.51943 15.7028 9.70691C15.5153 9.8944 15.2611 9.99973 14.9959 9.99973H13.8262C13.6197 10.5851 13.2367 11.092 12.7299 11.4505C12.2232 11.8091 11.6177 12.0016 10.997 12.0016C10.3763 12.0016 9.7708 11.8091 9.26408 11.4505C8.75735 11.092 8.37432 10.5851 8.16777 9.99973H0.999728C0.734583 9.99973 0.480299 9.8944 0.292814 9.70691C0.105328 9.51943 0 9.26514 0 9C0 8.73486 0.105328 8.48057 0.292814 8.29309C0.480299 8.1056 0.734583 8.00027 0.999728 8.00027H2.16941Z"
                fill="currentColor"
              />
            </svg>
          </Button>
        </div>

        {/* Filter Overlay */}
        {showFilters && (
          <div
            ref={filterRef}
            className="absolute right-1 top-13 w-[260px] bg-white rounded-xl shadow-2xl z-45 p-6 border border-gray-100"
          >
            {/* Employment Type Section */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection("employmentType")}
                className="w-full text-base font-semibold text-gray-700 mb-4 flex justify-between items-center hover:text-gray-900 transition-colors"
              >
                Type of employment
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 text-[#219CAE] transition-transform duration-200 ${
                    collapsedSections.employmentType ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {!collapsedSections.employmentType && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fullTime"
                      checked={filters.employmentType.fullTime}
                      onCheckedChange={() =>
                        handleEmploymentTypeChange("fullTime")
                      }
                      className="data-[state=checked]:bg-[#219CAE] data-[state=checked]:border-[#219CAE]"
                    />
                    <label htmlFor="fullTime" className="text-sm text-gray-700">
                      Full-Time Job
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="partTime"
                      checked={filters.employmentType.partTime}
                      onCheckedChange={() =>
                        handleEmploymentTypeChange("partTime")
                      }
                      className="data-[state=checked]:bg-[#219CAE] data-[state=checked]:border-[#219CAE]"
                    />
                    <label htmlFor="partTime" className="text-sm text-gray-700">
                      Part-Time Job
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Salary Range Section */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection("salaryRange")}
                className="w-full text-base font-semibold text-gray-700 mb-4 flex justify-between items-center hover:text-gray-900 transition-colors"
              >
                Salary Range
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 text-[#219CAE] transition-transform duration-200 ${
                    collapsedSections.salaryRange ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {!collapsedSections.salaryRange && (
                <>
                  <Slider
                    defaultValue={[10000, 1000000]}
                    max={1000000}
                    min={10000}
                    step={10000}
                    value={filters.salaryRange}
                    onValueChange={handleSalaryRangeChange}
                    className="mb-6"
                  />
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700">
                        ₹{filters.salaryRange[0].toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700">
                        ₹{filters.salaryRange[1].toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* City Section */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection("locations")}
                className="w-full text-base font-semibold text-gray-700 mb-4 flex justify-between items-center hover:text-gray-900 transition-colors"
              >
                City
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 text-[#219CAE] transition-transform duration-200 ${
                    collapsedSections.locations ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {!collapsedSections.locations && (
                <>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#219CAE]" />
                    <Input
                      placeholder="Search..."
                      className="pl-10 bg-blue-50 border-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="indore"
                        checked={filters.locations.indore}
                        onCheckedChange={() => handleLocationChange("indore")}
                        className="data-[state=checked]:bg-[#219CAE] data-[state=checked]:border-[#219CAE] data-[state=unchecked]:border-[#219CAE]"
                      />
                      <label htmlFor="indore" className="text-sm text-gray-700">
                        Indore
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="bhopal"
                        checked={filters.locations.bhopal}
                        onCheckedChange={() => handleLocationChange("bhopal")}
                        className="data-[state=checked]:bg-[#219CAE] data-[state=checked]:border-[#219CAE] data-[state=unchecked]:border-[#219CAE]"
                      />
                      <label htmlFor="bhopal" className="text-sm text-gray-700">
                        Bhopal
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mumbai"
                        checked={filters.locations.mumbai}
                        onCheckedChange={() => handleLocationChange("mumbai")}
                        className="data-[state=checked]:bg-[#219CAE] data-[state=checked]:border-[#219CAE] data-[state=unchecked]:border-[#219CAE]"
                      />
                      <label htmlFor="mumbai" className="text-sm text-gray-700">
                        Mumbai
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="delhi"
                        checked={filters.locations.delhi}
                        onCheckedChange={() => handleLocationChange("delhi")}
                        className="data-[state=checked]:bg-[#219CAE] data-[state=checked]:border-[#219CAE] data-[state=unchecked]:border-[#219CAE]"
                      />
                      <label htmlFor="delhi" className="text-sm text-gray-700">
                        Delhi
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pune"
                        checked={filters.locations.pune}
                        onCheckedChange={() => handleLocationChange("pune")}
                        className="data-[state=checked]:bg-[#219CAE] data-[state=checked]:border-[#219CAE] data-[state=unchecked]:border-[#219CAE]"
                      />
                      <label htmlFor="pune" className="text-sm text-gray-700">
                        Pune
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Seniority Level Section */}
            <div>
              <button
                onClick={() => toggleSection("seniorityLevel")}
                className="w-full text-base font-semibold text-gray-700 mb-4 flex justify-between items-center hover:text-gray-900 transition-colors"
              >
                Seniority Level
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 text-[#219CAE] transition-transform duration-200 ${
                    collapsedSections.seniorityLevel ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {!collapsedSections.seniorityLevel && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="entry"
                      checked={filters.seniorityLevel.entry}
                      onCheckedChange={() =>
                        handleSeniorityLevelChange("entry")
                      }
                      className="data-[state=checked]:bg-[#219CAE] data-[state=checked]:border-[#219CAE] data-[state=unchecked]:border-[#219CAE]"
                    />
                    <label htmlFor="entry" className="text-sm text-gray-700">
                      Entry Level
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="medium"
                      checked={filters.seniorityLevel.medium}
                      onCheckedChange={() =>
                        handleSeniorityLevelChange("medium")
                      }
                      className="data-[state=checked]:bg-[#219CAE] data-[state=checked]:border-[#219CAE] data-[state=unchecked]:border-[#219CAE]"
                    />
                    <label htmlFor="medium" className="text-sm text-gray-700">
                      Medium Level
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="senior"
                      checked={filters.seniorityLevel.senior}
                      onCheckedChange={() =>
                        handleSeniorityLevelChange("senior")
                      }
                      className="data-[state=checked]:bg-[#219CAE] data-[state=checked]:border-[#219CAE] data-[state=unchecked]:border-[#219CAE]"
                    />
                    <label htmlFor="senior" className="text-sm text-gray-700">
                      Senior Level
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
