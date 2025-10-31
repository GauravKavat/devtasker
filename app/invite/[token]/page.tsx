"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

interface InvitationData {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  project: {
    id: string;
    name: string;
    description: string;
  };
  inviter: {
    name: string;
  };
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const response = await fetch(`/api/invitations/verify?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Invalid invitation");
          return;
        }

        setInvitation(data.invitation);
      } catch (err) {
        setError("Failed to load invitation");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchInvitation();
    }
  }, [token]);

  async function handleAccept() {
    try {
      setAccepting(true);
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept invitation");
      }

      console.log("Invitation accepted successfully:", data);

      // Force a hard navigation to ensure cache is cleared
      window.location.href = `/projects/${data.projectSlug}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error || "Invitation not found"}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Link href="/projects" className="w-full">
              <Button className="w-full">Go to Projects</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Project Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">{invitation.project.name}</h3>
            <p className="text-sm text-muted-foreground">{invitation.project.description}</p>
          </div>
          
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invited by:</span>
              <span className="font-medium">{invitation.inviter.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium capitalize">{invitation.role}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your email:</span>
              <span className="font-medium">{invitation.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expires:</span>
              <span className="font-medium">
                {new Date(invitation.expires_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Link href="/projects" className="flex-1">
            <Button variant="outline" className="w-full">
              Decline
            </Button>
          </Link>
          <Button 
            onClick={handleAccept} 
            disabled={accepting}
            className="flex-1"
          >
            {accepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              "Accept Invitation"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
