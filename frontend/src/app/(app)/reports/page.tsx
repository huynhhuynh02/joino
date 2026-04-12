'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDate } from '@/lib/utils';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, AlertCircle, Calendar, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const COLORS = ['#00A86B', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function ReportsPage() {
  const [days, setDays] = useState('30');

  const workloadQuery = useQuery({
    queryKey: ['reports-workload'],
    queryFn: () => api.get<any[]>('/api/reports/workload')
  });
  const { data: workload, isLoading: wLoading } = workloadQuery;

  const progressQuery = useQuery({
    queryKey: ['reports-progress', days],
    queryFn: () => api.get<any[]>('/api/reports/progress', { days })
  });
  const { data: progress, isLoading: pLoading } = progressQuery;

  const statusQuery = useQuery({
    queryKey: ['reports-status'],
    queryFn: () => api.get<any>('/api/reports/status')
  });
  const { data: statusDist, isLoading: sLoading } = statusQuery;

  const overdueQuery = useQuery({
    queryKey: ['reports-overdue'],
    queryFn: () => api.get<any[]>('/api/reports/overdue')
  });
  const { data: overdue, isLoading: oLoading } = overdueQuery;

  const anyError = workloadQuery.isError || progressQuery.isError || statusQuery.isError || overdueQuery.isError;

  return (
    <div className="view-container pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Overview of workspace performance, task completion, and team workload.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted/20 px-3 py-1.5 rounded-lg border border-border/50">
          <Calendar className="w-4 h-4 text-muted-foreground/60" />
          <span className="text-sm text-muted-foreground/80 font-medium">Time range:</span>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[140px] bg-background h-8 border-border hover:border-border/80 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {anyError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-destructive font-medium">Some data failed to load. Charts may be incomplete.</p>
          <button
            onClick={() => {
              if (workloadQuery.isError) workloadQuery.refetch();
              if (progressQuery.isError) progressQuery.refetch();
              if (statusQuery.isError) statusQuery.refetch();
              if (overdueQuery.isError) overdueQuery.refetch();
            }}
            className="text-sm font-semibold text-destructive hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Progress Line Chart */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Task Completion Over Time</CardTitle>
            </div>
            <CardDescription>Number of tasks completed per day</CardDescription>
          </CardHeader>
          <CardContent>
            {pLoading ? <Skeleton className="h-[300px] w-full" /> : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progress || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
                    <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} tick={{fontSize: 12, fill: 'currentColor'}} className="text-muted-foreground" axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12, fill: 'currentColor'}} className="text-muted-foreground" axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="count" name="Tasks Done" stroke="#00A86B" strokeWidth={3} dot={false} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Donut Chart */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-base">Tasks by Status</CardTitle>
            </div>
            <CardDescription>Total tasks across all active projects</CardDescription>
          </CardHeader>
          <CardContent>
            {sLoading ? <Skeleton className="h-[300px] w-full" /> : (
              <div className="h-[300px] w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDist?.distribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="status"
                    >
                      {(statusDist?.distribution || []).map((entry: any, index: number) => {
                        const conf = STATUS_CONFIG[entry.status as keyof typeof STATUS_CONFIG];
                        return <Cell key={`cell-${index}`} fill={conf?.bg?.replace('bg-', '') || COLORS[index % COLORS.length]} />;
                      })}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                    <Legend verticalAlign="bottom" height={36} formatter={(val) => STATUS_CONFIG[val as keyof typeof STATUS_CONFIG]?.label || val} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                  <span className="text-3xl font-bold text-foreground">{statusDist?.total || 0}</span>
                  <span className="text-xs text-muted-foreground font-medium">TOTAL TASKS</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Workload Bar Chart */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              <CardTitle className="text-base">Workload per Member</CardTitle>
            </div>
            <CardDescription>Tasks assigned per user by status</CardDescription>
          </CardHeader>
          <CardContent>
            {wLoading ? <Skeleton className="h-[350px] w-full" /> : (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workload || []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
                    <XAxis dataKey="user.name" tick={{fontSize: 12, fill: 'currentColor'}} className="text-muted-foreground" axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12, fill: 'currentColor'}} className="text-muted-foreground" axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{ fill: 'hsl(var(--muted)/0.3)' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="todo" name="To Do" stackId="a" fill="#94A3B8" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="#3B82F6" />
                    <Bar dataKey="review" name="Review" stackId="a" fill="#F59E0B" />
                    <Bar dataKey="done" name="Done" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Tasks Table */}
        <Card className="border-destructive/20 shadow-sm overflow-hidden bg-destructive/5">
          <CardHeader className="pb-3 border-b border-destructive/10 mb-0 bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <CardTitle className="text-base text-foreground/90">Overdue Tasks</CardTitle>
              </div>
              <span className="text-sm font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                {overdue?.length || 0}
              </span>
            </div>
          </CardHeader>
          <CardContent className="bg-card px-0 pb-0">
            {oLoading ? (
              <div className="px-6 space-y-4 pb-6 mt-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !overdue?.length ? (
              <div className="py-8 text-center text-muted-foreground">No overdue tasks. Great job! 🎉</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Task</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdue.map((task: any) => (
                    <TableRow key={task.id} className="border-border/50 hover:bg-muted/30">
                      <TableCell className="pl-6">
                        <p className="font-medium text-sm text-foreground">{task.title}</p>
                        <p className="text-xs text-muted-foreground/60">{task.project.name}</p>
                      </TableCell>
                      <TableCell>
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6 border border-border/50">
                              <AvatarImage src={task.assignee.avatar || ''} />
                              <AvatarFallback className="text-[10px] bg-destructive/10 text-destructive">
                                {task.assignee.name.substring(0,2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-foreground/80">{task.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/40 italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold text-destructive px-2 py-0.5 rounded bg-destructive/10 border border-destructive/10">
                          {formatDate(task.dueDate)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Time Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TimeSummaryCard />
      </div>
    </div>
  );
}

function TimeSummaryCard() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['reports-time-summary'],
    queryFn: () => api.get<any>('/api/reports/time-summary'),
  });

  return (
    <Card className="border-border shadow-sm lg:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-500" />
            <CardTitle className="text-base">Time Logged Summary</CardTitle>
          </div>
          {summary && (
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
              <Clock className="w-3.5 h-3.5" />
              {summary.totalHours?.toFixed(1)} hrs total
            </div>
          )}
        </div>
        <CardDescription>Hours logged per project and per team member</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        ) : !summary?.totalHours ? (
          <div className="py-8 text-center text-muted-foreground">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-10" />
            <p className="text-sm">No time logged yet. Start tracking time from task detail panels.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Project */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">By Project</p>
              <div className="space-y-2">
                {summary.byProject?.map((item: any) => {
                  const pct = summary.totalHours > 0 ? (item.hours / summary.totalHours) * 100 : 0;
                  return (
                    <div key={item.project.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.project.color }} />
                          <span className="text-sm text-foreground font-medium">{item.project.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground">{item.hours.toFixed(1)} hrs</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-teal-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* By Member */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">By Member</p>
              <div className="space-y-2.5">
                {summary.byMember?.map((item: any) => {
                  const pct = summary.totalHours > 0 ? (item.hours / summary.totalHours) * 100 : 0;
                  return (
                    <div key={item.user.id} className="flex items-center gap-3">
                      <Avatar className="w-7 h-7 flex-shrink-0">
                        <AvatarImage src={item.user.avatar || ''} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {item.user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm text-foreground font-medium truncate">{item.user.name}</span>
                          <span className="text-xs font-semibold text-muted-foreground ml-2 flex-shrink-0">{item.hours.toFixed(1)} hrs</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
