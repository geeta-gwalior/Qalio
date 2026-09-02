"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Eye,
  Loader2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { getCookie } from "@/utils/getCookie";

interface Invitation {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  message?: string;
  status: "pending" | "accepted" | "declined";
  invitedAt: string;
  invitedBy: string;
}

interface ViewInvitationsModalProps {
  userRole: "college" | "company" | "university" | "student" | "admin";
  trigger?: React.ReactNode;
}

export function ViewInvitationsModal({
  userRole,
  trigger,
}: ViewInvitationsModalProps) {
  const [open, setOpen] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Determine what entity was invited based on user  role
  const isViewingCompanies =
    userRole === "college" || userRole === "university";
  const targetEntity = isViewingCompanies ? "Company" : "College";
  const targetEntityPlural = isViewingCompanies ? "Companies" : "Colleges";
  const EntityIcon = isViewingCompanies ? Building2 : GraduationCap;

  const fetchInvitations = async () => {
    setIsLoading(true);
    const token = getCookie("jwt");
    try {
      let apiUrl = "";

      // Determine API endpoint based on user role
      if (userRole === "college") {
        // College/University viewing invited companies
        apiUrl = `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/invited-companies`;
      } else if (userRole === "company") {
        // Company viewing invited colleges
        apiUrl = `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/company/invited-colleges`;
      } else {
        console.log("Invalid user role for viewing invitations");
      }

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      const invitationMap: any = {
        college: result.invitedCompanies,
        company: result.invitedColleges,
      };

      setInvitations(invitationMap[userRole] || []);
    } catch (error) {
      console.error("Fetch invitations error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch invitations"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchInvitations();
    }
  }, [open]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "declined":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Eye className="w-4 h-4 mr-2" />
      View Invited {targetEntityPlural}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EntityIcon className="w-5 h-5" />
            Invited {targetEntityPlural}
          </DialogTitle>
          <DialogDescription>
            View all {targetEntityPlural.toLowerCase()} you have invited to join
            your platform.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading invitations...</span>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Invitations Yet
              </h3>
              <p className="text-gray-500">
                You haven&apos;t invited any {targetEntityPlural.toLowerCase()}{" "}
                yet. Start by sending your first invitation!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation, index) => (
                <Card
                  key={`${invitation.id ?? "no-id"}-${index}`}
                  className="border border-gray-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <EntityIcon className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {invitation.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Invited {formatDate(invitation.invitedAt)}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(invitation.status)}>
                        {invitation.status.charAt(0).toUpperCase() +
                          invitation.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {invitation.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {invitation.phone}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 md:col-span-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {invitation.address}
                        </span>
                      </div>
                    </div>

                    {invitation.message && (
                      <>
                        <Separator className="my-3" />
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-700">
                            <strong>Message:</strong> {invitation.message}
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {!isLoading && invitations.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-gray-500">
              Total: {invitations.length} invitation
              {invitations.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-yellow-50">
                Pending:{" "}
                {invitations.filter((inv) => inv.status === "pending").length}
              </Badge>
              <Badge variant="outline" className="bg-green-50">
                Accepted:{" "}
                {invitations.filter((inv) => inv.status === "accepted").length}
              </Badge>
              <Badge variant="outline" className="bg-red-50">
                Declined:{" "}
                {invitations.filter((inv) => inv.status === "declined").length}
              </Badge>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
