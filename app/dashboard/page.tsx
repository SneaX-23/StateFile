import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Repo } from "@/types/repos"
import { apiFetch } from '@/lib/api';
import BlueprintLayout from '@/components/ui/blueprint-layout';

async function getProjects(): Promise<Repo[]> {
  const data = await apiFetch<{ projects: Repo[] }>('/api/v1/get-projects',
    {
      method: "GET",
      credentials: 'include',
      cache: 'no-store',
    })
  return data.projects
}

export default async function Page() {
  const projects = await getProjects();
  return (
    <BlueprintLayout>
      <SidebarProvider>
        <AppSidebar projects={projects} className="bg-transparent" />
        <SidebarInset className="bg-transparent">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-vertical:h-4 data-vertical:self-auto"
              />
              {/* <Breadcrumb> */}
              {/*   <BreadcrumbList> */}
              {/*     <BreadcrumbItem className="hidden md:block"> */}
              {/*       <BreadcrumbLink href="#"> */}
              {/*         Build Your Application */}
              {/*       </BreadcrumbLink> */}
              {/*     </BreadcrumbItem> */}
              {/*     <BreadcrumbSeparator className="hidden md:block" /> */}
              {/*     <BreadcrumbItem> */}
              {/*       <BreadcrumbPage>Data Fetching</BreadcrumbPage> */}
              {/*     </BreadcrumbItem> */}
              {/*   </BreadcrumbList> */}
              {/* </Breadcrumb> */}
            </div>
          </header>
        </SidebarInset>
      </SidebarProvider>
    </BlueprintLayout>
  )
}
