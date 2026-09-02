// "use client";

// import { AVATAR_PLACEHOLDER_IMAGE } from "@/constants";
// import { convertToHumanReadable } from "@/utils";
// import { useTransition } from "react";
// import { Card } from "./ui/card";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "./ui/tooltip";

// // Helper function to get nested values (for deep object structures like 'customer.name')
// function getNestedValue(obj: any, path: string) {
//   return path
//     .split(".")
//     .reduce(
//       (acc, part) => (acc && acc[part] !== undefined ? acc[part] : ""),
//       obj
//     );
// }

// // Dynamic Badge Rendering based on status, type, or custom value
// const Badge = ({ label, type }: { label: string; type: string }) => {
//   const badgeTypes: { [key: string]: string } = {
//     active: "bg-green-500",
//     inactive: "bg-gray-500",
//     pending: "bg-yellow-500",
//     new: "bg-blue-500",
//   };

//   return (
//     <span
//       className={`text-white text-xs font-semibold py-1 px-3 rounded-full ${
//         badgeTypes[type] || "bg-gray-300"
//       }`}
//     >
//       {label}
//     </span>
//   );
// };

// // Progress Bar rendering based on the progress value
// const ProgressBar = ({ value }: { value: any }) => {
//   // Ensure value is a valid number
//   const normalizedValue = isNaN(value) ? 0 : Math.min(Math.max(value, 0), 100); // Default to 0 if value is invalid

//   // Determine the color based on the progress value
//   let progressColor = "#FF0101"; // Default red for low values

//   if (normalizedValue >= 30 && normalizedValue < 70) {
//     progressColor = "#F68622"; // Orange for medium values
//   } else if (normalizedValue >= 70) {
//     progressColor = "#02C661"; // Green for high values
//   }

//   return (
//     <div className="w-[100px] bg-gray-300 rounded-full h-2">
//       <div
//         className="h-2 rounded-full"
//         style={{
//           width: `${normalizedValue}%`,
//           backgroundColor: progressColor, // Dynamically set the color
//         }}
//       />
//       <div className="text-center text-xs font-semibold mt-1">{`${normalizedValue}%`}</div>
//     </div>
//   );
// };

// interface AdditionalButton {
//   name: string;
//   onClick: (row: any) => void;
//   icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
//   customStyles?: string;
//   type?: string;
// }

// interface AdditionalButtons {
//   isColumn: boolean;
//   columnName: string;
//   buttons: AdditionalButton[];
// }

// interface QalioTableProps {
//   setRefresh?: () => void;
//   rowData: Array<Record<string, any>>;
//   columnsData: Array<
//     | {
//         label: string;
//         value: string;
//         isFormateDate?: boolean;
//         isDate?: boolean;
//         type?: string;
//       }
//     | string
//   >;
//   additionalStyles?: string;
//   avatarRequired?: boolean;
//   showDesignation?: boolean;
//   actionButtons?: AdditionalButton[];
//   additionalButtons?: AdditionalButtons;
// }

// const QalioTable: React.FC<QalioTableProps> = ({
//   setRefresh,
//   rowData,
//   columnsData,
//   additionalStyles,
//   avatarRequired = false,
//   showDesignation = false,
//   actionButtons,
//   additionalButtons,
// }) => {
//   const [isPending, startTransition] = useTransition();

//   // Dynamically add 'Actions' column if action buttons are provided
//   if (actionButtons && !columnsData.some((col) => col === "Actions")) {
//     columnsData.push("Actions");
//   }

//   // Dynamically add extra buttons column if additional buttons are provided
//   if (
//     additionalButtons?.isColumn &&
//     !columnsData.some((col) => col === additionalButtons.columnName)
//   ) {
//     columnsData.push(additionalButtons.columnName);
//   }

//   return (
//     <div className={`overflow-x-auto w-full ${additionalStyles}`}>
//       <div className="min-w-max">
//         {/* Header Row */}
//         <div className="flex items-center w-full bg-[#219CAE] rounded-lg text-white">
//           {columnsData.map((col, index) => {
//             const columnLabel = typeof col === "string" ? col : col.label;
//             return (
//               <div
//                 key={index}
//                 className="flex-1 px-4 py-4 font-semibold text-base whitespace-nowrap text-left"
//                 style={{ minWidth: "180px" }}
//               >
//                 {columnLabel}
//               </div>
//             );
//           })}
//         </div>

//         {/* Data Rows */}
//         <div className="w-full">
//           {rowData.map((row, rowIndex) => (
//             <Card
//               key={rowIndex}
//               className="flex my-2 hover:bg-gray-100 flex-row py-0 rounded-lg"
//             >
//               {columnsData.map((col: any, colIndex) => {
//                 const column = typeof col === "string" ? col : col.value;

//                 return (
//                   <div
//                     key={colIndex}
//                     className="flex justify-start flex-1 px-4 py-4 text-sm whitespace-nowrap"
//                     style={{ minWidth: "180px" }}
//                   >
//                     {/* Avatar handling dynamically */}
//                     <div className="flex flex-col capitalize items-start justify-start whitespace-nowrap">
//                       {avatarRequired && column.toLowerCase() === "name" && (
//                         <div
//                           className="relative -ml-2 mr-3 flex items-center justify-center min-h-10 min-w-10 rounded-full text-white text-base font-semibold border-3 border-white ring-2 ring-white"
//                           style={{
//                             backgroundImage: `url(${
//                               row.avatar || AVATAR_PLACEHOLDER_IMAGE
//                             })`,
//                             backgroundSize: "cover",
//                             backgroundPosition: "center",
//                             backgroundBlendMode: "overlay",
//                           }}
//                         ></div>
//                       )}
//                     </div>

//                     {/* Column Data */}
//                     <div className="flex text-wrap flex-col capitalize items-center justify-center">
//                       {(() => {
//                         // Format dates
//                         if (col.isFormateDate) {
//                           return convertToHumanReadable(
//                             row[column],
//                             "dateTime"
//                           );
//                         }

//                         if (col.isFormateOnlyDate) {
//                           return convertToHumanReadable(
//                             row[column],
//                             "dateOnly"
//                           );
//                         }

//                         // Handle createdAt or other date columns
//                         if (
//                           column === "Created" ||
//                           column === "createdAt" ||
//                           col.isDate
//                         ) {
//                           return convertToHumanReadable(
//                             row[column],
//                             "dateTime"
//                           );
//                         }

//                         // Handle Badge Rendering (for "status", "role", or custom columns)
//                         if (col.type === "badge") {
//                           return (
//                             <Badge
//                               label={row[column]}
//                               type={row[column].toLowerCase()}
//                             />
//                           );
//                         }

//                         // Handle Progress Bar Rendering (for columns like "progress" or "completion")
//                         if (col.type === "progress") {
//                           return <ProgressBar value={row[column]} />;
//                         }

//                         // Return the nested value (like 'customer.name')
//                         return getNestedValue(row, column);
//                       })()}

//                       {/* Action Buttons */}
//                       {actionButtons && column === "Actions" && (
//                         <div className="flex justify-start mt-2">
//                           <TooltipProvider>
//                             {actionButtons.map((button, index) => (
//                               <Tooltip key={index}>
//                                 <TooltipTrigger asChild>
//                                   <button
//                                     onClick={() => button.onClick(row)}
//                                     className="text-primary font-semibold mr-2"
//                                   >
//                                     <button.icon
//                                       className={`w-4 h-4 ${getColor(
//                                         button?.type
//                                       )}`}
//                                     />
//                                   </button>
//                                 </TooltipTrigger>
//                                 <TooltipContent>
//                                   <p>{button.name || "Action"}</p>
//                                 </TooltipContent>
//                               </Tooltip>
//                             ))}
//                           </TooltipProvider>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })}
//             </Card>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// // Helper function to determine color based on action type
// function getColor(type?: string) {
//   if (!type) return "";
//   switch (type) {
//     case "danger":
//       return "text-red-500";
//     case "warning":
//       return "text-yellow-500";
//     case "success":
//       return "text-[#095589]";
//     default:
//       return "text-primary";
//   }
// }

// export default QalioTable;

"use client";
import { AVATAR_PLACEHOLDER_IMAGE } from "@/constants";
import type React from "react";

import { convertToHumanReadable } from "@/utils";
import { useTransition } from "react";
import { Card } from "./ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import Link from "next/link"; // Import Link for navigation

// Helper function to get nested values (for deep object structures like 'customer.name')
function getNestedValue(obj: any, path: string) {
  return path
    .split(".")
    .reduce(
      (acc, part) => (acc && acc[part] !== undefined ? acc[part] : ""),
      obj
    );
}

// Dynamic Badge Rendering based on status, type, or custom value
const Badge = ({ label, type }: { label: string; type: string }) => {
  const badgeTypes: { [key: string]: string } = {
    active: "bg-green-500",
    inactive: "bg-gray-500",
    pending: "bg-yellow-500",
    new: "bg-blue-500",
  };
  return (
    <span
      className={`text-white text-xs font-semibold py-1 px-3 rounded-full ${
        badgeTypes[type] || "bg-gray-300"
      }`}
    >
      {label}
    </span>
  );
};

// Progress Bar rendering based on the progress value
const ProgressBar = ({ value }: { value: any }) => {
  // Ensure value is a valid number
  const normalizedValue = isNaN(value) ? 0 : Math.min(Math.max(value, 0), 100); // Default to 0 if value is invalid
  // Determine the color based on the progress value
  let progressColor = "#FF0101"; // Default red for low values
  if (normalizedValue >= 30 && normalizedValue < 70) {
    progressColor = "#F68622"; // Orange for medium values
  } else if (normalizedValue >= 70) {
    progressColor = "#02C661"; // Green for high values
  }
  return (
    <div className="w-[100px] bg-gray-300 rounded-full h-2">
      <div
        className="h-2 rounded-full"
        style={{
          width: `${normalizedValue}%`,
          backgroundColor: progressColor, // Dynamically set the color
        }}
      />
      <div className="text-center text-xs font-semibold mt-1">{`${normalizedValue}%`}</div>
    </div>
  );
};

interface AdditionalButton {
  name: string;
  onClick?: (row: any) => void; // Made optional
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  customStyles?: string;
  type?: string;
  href?: (row: any) => string; // New: Function to generate href based on row data
}

interface AdditionalButtons {
  isColumn: boolean;
  columnName: string;
  buttons: AdditionalButton[];
}

interface QalioTableProps {
  setRefresh?: () => void;
  rowData: Array<Record<string, any>>;
  columnsData: Array<
    | {
        label: string;
        value: string;
        isFormateDate?: boolean;
        isDate?: boolean;
        type?: string;
        isLink?: boolean; // New property
        linkHref?: (row: any) => string; // New property
      }
    | string
  >;
  additionalStyles?: string;
  avatarRequired?: boolean;
  showDesignation?: boolean;
  actionButtons?: AdditionalButton[];
  additionalButtons?: AdditionalButtons;
}

const QalioTable: React.FC<QalioTableProps> = ({
  setRefresh,
  rowData,
  columnsData,
  additionalStyles,
  avatarRequired = false,
  showDesignation = false,
  actionButtons,
  additionalButtons,
}) => {
  const [isPending, startTransition] = useTransition();

  // Dynamically add 'Actions' column if action buttons are provided
  if (actionButtons && !columnsData.some((col) => col === "Actions")) {
    columnsData.push("Actions");
  }
  // Dynamically add extra buttons column if additional buttons are provided
  if (
    additionalButtons?.isColumn &&
    !columnsData.some((col) => col === additionalButtons.columnName)
  ) {
    columnsData.push(additionalButtons.columnName);
  }

  return (
    <div className={`overflow-x-auto w-full ${additionalStyles}`}>
      <div className="min-w-max">
        {/* Header Row */}
        <div className="flex items-center w-full bg-[#219CAE] rounded-lg text-white">
          {columnsData.map((col, index) => {
            const columnLabel = typeof col === "string" ? col : col.label;
            return (
              <div
                key={index}
                className="flex-1 px-4 py-4 font-semibold text-base whitespace-nowrap text-left"
                style={{ minWidth: "180px" }}
              >
                {columnLabel}
              </div>
            );
          })}
        </div>
        {/* Data Rows */}
        <div className="w-full">
          {rowData.map((row, rowIndex) => (
            <Card
              key={rowIndex}
              className="flex my-2 hover:bg-gray-100 flex-row py-0 rounded-lg"
            >
              {columnsData.map((col: any, colIndex) => {
                const column = typeof col === "string" ? col : col.value;
                return (
                  <div
                    key={colIndex}
                    className="flex justify-start flex-1 px-4 py-4 text-sm whitespace-nowrap"
                    style={{ minWidth: "180px" }}
                  >
                    {/* Avatar handling dynamically */}
                    <div className="flex flex-col capitalize items-start justify-start whitespace-nowrap">
                      {avatarRequired && column.toLowerCase() === "name" && (
                        <div
                          className="relative -ml-2 mr-3 flex items-center justify-center min-h-10 min-w-10 rounded-full text-white text-base font-semibold border-3 border-white ring-2 ring-white"
                          style={{
                            backgroundImage: `url(${
                              typeof row.avatar === "string" &&
                              row.avatar.trim() !== ""
                                ? row.avatar
                                : AVATAR_PLACEHOLDER_IMAGE
                            })`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundBlendMode: "overlay",
                          }}
                        ></div>
                      )}
                    </div>
                    {/* Column Data */}
                    <div
                      className={`flex text-wrap flex-col items-center justify-center ${
                        column.toLowerCase() !== "email" ? "capitalize" : ""
                      }`}
                    >
                      {(() => {
                        const cellContent = (() => {
                          // Format dates
                          if (col.isFormateDate) {
                            return convertToHumanReadable(
                              row[column],
                              "dateTime"
                            );
                          }
                          if (col.isFormateOnlyDate) {
                            return convertToHumanReadable(
                              row[column],
                              "dateOnly"
                            );
                          }
                          // Handle createdAt or other date columns
                          if (
                            column === "Created" ||
                            column === "createdAt" ||
                            col.isDate
                          ) {
                            return convertToHumanReadable(
                              row[column],
                              "dateTime"
                            );
                          }
                          // Handle Badge Rendering (for "status", "role", or custom columns)
                          if (col.type === "badge") {
                            return (
                              <Badge
                                label={row[column]}
                                type={row[column].toLowerCase()}
                              />
                            );
                          }
                          // Handle Progress Bar Rendering (for columns like "progress" or "completion")
                          if (col.type === "progress") {
                            return <ProgressBar value={row[column]} />;
                          }
                          // Return the nested value (like 'customer.name')
                          return getNestedValue(row, column);
                        })();

                        if (col.isLink && col.linkHref) {
                          return (
                            <Link
                              href={col.linkHref(row)}
                              className="hover:underline cursor-pointer"
                            >
                              {cellContent}
                            </Link>
                          );
                        }
                        return cellContent;
                      })()}
                      {/* Action Buttons */}
                      {actionButtons && column === "Actions" && (
                        <div className="flex justify-start mt-2">
                          <TooltipProvider>
                            {actionButtons.map((button, index) => {
                              const ButtonContent = (
                                <button.icon
                                  key={index}
                                  className={`w-4 h-4 ${getColor(
                                    button?.type
                                  )}`}
                                />
                              );

                              if (button.href) {
                                const linkHref = button.href(row);
                                return (
                                  <Tooltip key={index}>
                                    <TooltipTrigger asChild>
                                      <Link
                                        href={linkHref}
                                        onClick={() => button.onClick?.(row)}
                                        className="text-primary font-semibold mr-2"
                                      >
                                        {ButtonContent}
                                      </Link>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{button.name || "Action"}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              } else {
                                return (
                                  <Tooltip key={index}>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => button.onClick?.(row)}
                                        className="text-primary cursor-pointer font-semibold mr-2"
                                      >
                                        {ButtonContent}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{button.name || "Action"}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              }
                            })}
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function to determine color based on action type
function getColor(type?: string) {
  if (!type) return "";
  switch (type) {
    case "danger":
      return "text-red-500";
    case "warning":
      return "text-yellow-500";
    case "success":
      return "text-[#095589]";
    default:
      return "text-primary";
  }
}

export default QalioTable;
