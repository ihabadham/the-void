"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Calendar, Clock, AlertCircle, Plus } from "lucide-react"
import Link from "next/link"

interface Application {
  id: string
  company: string
  position: string
  status: "applied" | "assessment" | "interview" | "offer" | "rejected" | "withdrawn"
  appliedDate: string
  nextDate?: string
  nextEvent?: string
}

const statusColors = {
  applied: "bg-blue-500",
  assessment: "bg-yellow-500",
  interview: "bg-cyan-500",
  offer: "bg-[#00F57A]",
  rejected: "bg-red-500",
  withdrawn: "bg-gray-500",
}

export default function CalendarPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Application[]>([])
  const [pastEvents, setPastEvents] = useState<Application[]>([])

  useEffect(() => {
    // Load applications from localStorage or use dummy data
    const stored = localStorage.getItem("void-applications")
    let apps: Application[] = []

    if (stored) {
      apps = JSON.parse(stored)
    }

    // If no stored data, use dummy data
    if (apps.length === 0) {
      apps = [
        {
          id: "1",
          company: "TechCorp",
          position: "Senior Frontend Developer",
          status: "interview",
          appliedDate: "2024-01-15",
          nextDate: "2024-01-25",
          nextEvent: "Technical Interview",
        },
        {
          id: "2",
          company: "StartupXYZ",
          position: "Full Stack Engineer",
          status: "rejected",
          appliedDate: "2024-01-10",
        },
        {
          id: "3",
          company: "BigTech Inc",
          position: "Software Engineer",
          status: "assessment",
          appliedDate: "2024-01-20",
          nextDate: "2024-01-28",
          nextEvent: "Coding Assessment",
        },
        {
          id: "5",
          company: "DataDriven Co",
          position: "Frontend Architect",
          status: "offer",
          appliedDate: "2024-01-05",
          nextDate: "2024-01-30",
          nextEvent: "Offer Response Deadline",
        },
        {
          id: "6",
          company: "CloudFirst",
          position: "Senior Developer",
          status: "interview",
          appliedDate: "2024-01-18",
          nextDate: "2024-01-26",
          nextEvent: "Final Round Interview",
        },
      ]
    }

    setApplications(apps)

    const now = new Date()
    const eventsWithDates = apps.filter((app: Application) => app.nextDate)

    const upcoming = eventsWithDates
      .filter((app: Application) => new Date(app.nextDate!) > now)
      .sort((a: Application, b: Application) => new Date(a.nextDate!).getTime() - new Date(b.nextDate!).getTime())

    const past = eventsWithDates
      .filter((app: Application) => new Date(app.nextDate!) <= now)
      .sort((a: Application, b: Application) => new Date(b.nextDate!).getTime() - new Date(a.nextDate!).getTime())

    setUpcomingEvents(upcoming)
    setPastEvents(past)
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Tomorrow"
    if (diffDays === -1) return "Yesterday"
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`

    return date.toLocaleDateString()
  }

  const getUrgencyColor = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return "text-red-400"
    if (diffDays <= 2) return "text-yellow-400"
    if (diffDays <= 7) return "text-[#00F57A]"
    return "text-gray-400"
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="font-mono text-3xl font-medium text-white">Calendar</h1>
            <p className="text-gray-400 font-mono text-sm">
              {upcomingEvents.length === 0
                ? "No upcoming events. The void is quiet."
                : `${upcomingEvents.length} upcoming events in the pipeline.`}
            </p>
          </div>
        </div>
        <Button asChild className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90">
          <Link href="/applications/new">
            <Plus className="h-4 w-4 mr-2" />
            Log Application
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card className="void-card">
          <CardHeader>
            <CardTitle className="font-mono text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#00F57A]" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 font-mono text-sm">No upcoming events scheduled.</p>
                <p className="text-gray-600 font-mono text-xs mt-2">The void awaits your next move.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 rounded border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-[#00F57A] rounded-full"></div>
                        <div className="w-px h-8 bg-gray-700 mt-1"></div>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{app.company}</p>
                        <p className="text-gray-400 text-xs">{app.position}</p>
                        <p className="text-gray-500 text-xs font-mono">{app.nextEvent || "Event"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono ${getUrgencyColor(app.nextDate!)}`}>
                        {formatDate(app.nextDate!)}
                      </p>
                      <Badge className={`${statusColors[app.status]} text-black text-xs font-mono mt-1`}>
                        {app.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Events */}
        <Card className="void-card">
          <CardHeader>
            <CardTitle className="font-mono text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gray-400" />
              Past Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pastEvents.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 font-mono text-sm">No past events recorded.</p>
                <p className="text-gray-600 font-mono text-xs mt-2">History begins with your first event.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {pastEvents.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 rounded border border-gray-800 opacity-75"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                        <div className="w-px h-8 bg-gray-800 mt-1"></div>
                      </div>
                      <div>
                        <p className="text-gray-300 text-sm font-medium">{app.company}</p>
                        <p className="text-gray-500 text-xs">{app.position}</p>
                        <p className="text-gray-600 text-xs font-mono">{app.nextEvent || "Event"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-sm font-mono">{formatDate(app.nextDate!)}</p>
                      <Badge className={`${statusColors[app.status]} text-black text-xs font-mono mt-1 opacity-75`}>
                        {app.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card className="void-card">
        <CardHeader>
          <CardTitle className="font-mono text-white">Event Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded border border-gray-700">
              <p className="text-2xl font-mono font-bold text-[#00F57A]">{upcomingEvents.length}</p>
              <p className="text-gray-400 text-sm font-mono">Upcoming</p>
            </div>
            <div className="text-center p-4 rounded border border-gray-700">
              <p className="text-2xl font-mono font-bold text-yellow-500">
                {
                  upcomingEvents.filter((app) => {
                    const diffDays = Math.ceil(
                      (new Date(app.nextDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                    )
                    return diffDays <= 7
                  }).length
                }
              </p>
              <p className="text-gray-400 text-sm font-mono">This Week</p>
            </div>
            <div className="text-center p-4 rounded border border-gray-700">
              <p className="text-2xl font-mono font-bold text-red-500">
                {
                  upcomingEvents.filter((app) => {
                    const diffDays = Math.ceil(
                      (new Date(app.nextDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                    )
                    return diffDays <= 2
                  }).length
                }
              </p>
              <p className="text-gray-400 text-sm font-mono">Urgent</p>
            </div>
            <div className="text-center p-4 rounded border border-gray-700">
              <p className="text-2xl font-mono font-bold text-gray-400">{pastEvents.length}</p>
              <p className="text-gray-400 text-sm font-mono">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
