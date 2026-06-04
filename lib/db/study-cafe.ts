import { findActiveProjectYouthByNameAndPhone } from "@/lib/db/dadareum";
import { listProjects } from "@/lib/db/organizations";
import { getPhoneDigest, normalizePersonName } from "@/lib/phone-auth";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabase";
import type {
  Project,
  ProjectYouth,
  StudyCafeCheckin,
  StudyCafeCheckinInput,
  StudyCafeCheckinStatus,
} from "@/lib/types";

let memoryCheckinId = 1;
let memoryCheckins: StudyCafeCheckin[] = [];

const now = () => new Date().toISOString();

function asNumber(value: unknown) {
  return Number(value ?? 0) || 0;
}

function asNullableNumber(value: unknown) {
  if (value == null || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asStatus(value: unknown): StudyCafeCheckinStatus {
  return value === "approved" || value === "rejected" ? value : "pending";
}

function getKoreanDate(value = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(value);
}

export async function getDefaultStudyCafeProject(projectId?: number | null): Promise<Project | null> {
  const projects = await listProjects();
  return (
    projects.find((project) => project.id === projectId) ??
    projects.find((project) => project.guideline_code === "youth-dadareum-2026") ??
    projects[0] ??
    null
  );
}

export async function authenticateStudyCafeYouth(input: {
  project_id?: number | null;
  name: string;
  phone_number: string;
}): Promise<{ project: Project; youth: ProjectYouth } | null> {
  const project = await getDefaultStudyCafeProject(input.project_id ?? null);
  if (!project) return null;

  const normalizedName = normalizePersonName(input.name);
  const phoneDigest = getPhoneDigest(input.phone_number);
  const youth = await findActiveProjectYouthByNameAndPhone(project.id, normalizedName, phoneDigest);

  return youth ? { project, youth } : null;
}

function normalizeCheckin(
  row: Record<string, unknown>,
  youthById: Map<number, ProjectYouth>,
  projectById: Map<number, Project>,
): StudyCafeCheckin {
  const projectId = asNumber(row.project_id);
  const youthId = asNumber(row.youth_id);
  const youth = youthById.get(youthId);
  const project = projectById.get(projectId);

  return {
    id: asNumber(row.id),
    project_id: projectId,
    project_name: project?.name ?? "",
    youth_id: youthId,
    youth_name: youth?.display_name ?? asText(row.youth_name),
    youth_serial_no: youth?.serial_no ?? null,
    submitted_at: asText(row.submitted_at),
    attendance_date: asText(row.attendance_date),
    cafe_name: asText(row.cafe_name),
    memo: asText(row.memo),
    photo_data_url: asText(row.photo_data_url),
    photo_file_name: asText(row.photo_file_name),
    photo_mime_type: asText(row.photo_mime_type),
    photo_size_bytes: asNumber(row.photo_size_bytes),
    latitude: asNullableNumber(row.latitude),
    longitude: asNullableNumber(row.longitude),
    location_accuracy_m: asNullableNumber(row.location_accuracy_m),
    status: asStatus(row.status),
    reviewed_at: asText(row.reviewed_at),
    reviewed_by: asText(row.reviewed_by),
    review_note: asText(row.review_note),
    created_at: asText(row.created_at),
    updated_at: asText(row.updated_at),
  };
}

async function getYouthMap(projectIds: number[]) {
  const youthById = new Map<number, ProjectYouth>();
  if (!projectIds.length || !hasSupabaseEnv()) return youthById;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("project_youths")
    .select("*")
    .in("project_id", projectIds);
  if (error) throw error;

  for (const row of data ?? []) {
    const youth = {
      id: asNumber(row.id),
      project_id: asNumber(row.project_id),
      serial_no: asNumber(row.serial_no),
      display_name: asText(row.display_name),
      phone_last4: asText(row.phone_last4),
      has_phone: Boolean(asText(row.phone_digest) || asText(row.phone_ciphertext) || asText(row.phone_last4)),
      enrolled_on: asText(row.enrolled_on),
      withdrawn_on: asText(row.withdrawn_on),
      withdrawal_reason: asText(row.withdrawal_reason),
      status:
        row.status === "withdrawn" || row.status === "completed"
          ? row.status
          : "active",
      notes: asText(row.notes),
      deleted_at: asText(row.deleted_at),
      created_at: asText(row.created_at),
      updated_at: asText(row.updated_at),
    } satisfies ProjectYouth;
    youthById.set(youth.id, youth);
  }

  return youthById;
}

export async function listStudyCafeCheckins(projectId?: number | null): Promise<StudyCafeCheckin[]> {
  const projects = await listProjects();
  const projectById = new Map(projects.map((project) => [project.id, project]));

  const memoryRows = () =>
    memoryCheckins
      .filter((checkin) => (projectId ? checkin.project_id === projectId : true))
      .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));

  if (!hasSupabaseEnv()) {
    return memoryRows();
  }

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("study_cafe_checkins")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (projectId) query = query.eq("project_id", projectId);

    const { data, error } = await query;
    if (error) throw error;

    const projectIds = Array.from(new Set((data ?? []).map((row) => asNumber(row.project_id)).filter(Boolean)));
    const youthById = await getYouthMap(projectIds);
    return (data ?? []).map((row) => normalizeCheckin(row, youthById, projectById));
  } catch {
    return memoryCheckins
      .filter((checkin) => (projectId ? checkin.project_id === projectId : true))
      .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
  }
}

export async function listStudyCafeCheckinsForYouth(
  projectId: number,
  youthId: number,
): Promise<StudyCafeCheckin[]> {
  if (!projectId || !youthId) return [];

  const projects = await listProjects();
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const memoryRows = () =>
    memoryCheckins
      .filter((checkin) => checkin.project_id === projectId && checkin.youth_id === youthId)
      .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));

  if (!hasSupabaseEnv()) return memoryRows();

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("study_cafe_checkins")
      .select("*")
      .eq("project_id", projectId)
      .eq("youth_id", youthId)
      .order("submitted_at", { ascending: false });
    if (error) throw error;

    const youthById = await getYouthMap([projectId]);
    return (data ?? []).map((row) => normalizeCheckin(row, youthById, projectById));
  } catch {
    return memoryRows();
  }
}

export async function createStudyCafeCheckin(input: StudyCafeCheckinInput): Promise<StudyCafeCheckin> {
  const projects = await listProjects();
  const project = projects.find((item) => item.id === input.project_id) ?? null;
  const submittedAt = now();
  const attendanceDate = getKoreanDate(new Date(submittedAt));

  const createMemoryCheckin = async () => {
    let youthName = "";
    let youthSerialNo: number | null = null;
    try {
      const youthById = await getYouthMap([input.project_id]);
      const youth = youthById.get(input.youth_id);
      youthName = youth?.display_name ?? "";
      youthSerialNo = youth?.serial_no ?? null;
    } catch {
      // Keep the check-in usable even when only the compatibility store is available.
    }

    const created: StudyCafeCheckin = {
      id: memoryCheckinId++,
      project_id: input.project_id,
      project_name: project?.name ?? "",
      youth_id: input.youth_id,
      youth_name: youthName,
      youth_serial_no: youthSerialNo,
      submitted_at: submittedAt,
      attendance_date: attendanceDate,
      cafe_name: input.cafe_name,
      memo: input.memo,
      photo_data_url: input.photo_data_url,
      photo_file_name: input.photo_file_name,
      photo_mime_type: input.photo_mime_type,
      photo_size_bytes: input.photo_size_bytes,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      location_accuracy_m: input.location_accuracy_m ?? null,
      status: "pending",
      reviewed_at: "",
      reviewed_by: "",
      review_note: "",
      created_at: submittedAt,
      updated_at: submittedAt,
    };
    memoryCheckins = [created, ...memoryCheckins];
    return created;
  };

  if (!hasSupabaseEnv()) {
    return createMemoryCheckin();
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("study_cafe_checkins")
      .insert({
        project_id: input.project_id,
        youth_id: input.youth_id,
        submitted_at: submittedAt,
        attendance_date: attendanceDate,
        cafe_name: input.cafe_name,
        memo: input.memo,
        photo_data_url: input.photo_data_url,
        photo_file_name: input.photo_file_name,
        photo_mime_type: input.photo_mime_type,
        photo_size_bytes: input.photo_size_bytes,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        location_accuracy_m: input.location_accuracy_m ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;

    const youthById = await getYouthMap([input.project_id]);
    const projectById = new Map(projects.map((item) => [item.id, item]));
    return normalizeCheckin(data, youthById, projectById);
  } catch {
    return createMemoryCheckin();
  }
}

export async function reviewStudyCafeCheckin(
  id: number,
  input: { status: StudyCafeCheckinStatus; review_note: string; reviewed_by: string },
) {
  const status = asStatus(input.status);
  const reviewedAt = status === "pending" ? null : now();

  if (!hasSupabaseEnv()) {
    memoryCheckins = memoryCheckins.map((checkin) =>
      checkin.id === id
        ? {
            ...checkin,
            status,
            reviewed_at: reviewedAt ?? "",
            reviewed_by: reviewedAt ? input.reviewed_by : "",
            review_note: input.review_note,
            updated_at: now(),
          }
        : checkin,
    );
    return memoryCheckins.find((checkin) => checkin.id === id) ?? null;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("study_cafe_checkins")
      .update({
        status,
        reviewed_at: reviewedAt,
        reviewed_by: reviewedAt ? input.reviewed_by : "",
        review_note: input.review_note,
        updated_at: now(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;

    const projects = await listProjects();
    const projectById = new Map(projects.map((project) => [project.id, project]));
    const youthById = await getYouthMap([asNumber(data.project_id)]);
    return normalizeCheckin(data, youthById, projectById);
  } catch {
    memoryCheckins = memoryCheckins.map((checkin) =>
      checkin.id === id
        ? {
            ...checkin,
            status,
            reviewed_at: reviewedAt ?? "",
            reviewed_by: reviewedAt ? input.reviewed_by : "",
            review_note: input.review_note,
            updated_at: now(),
          }
        : checkin,
    );
    return memoryCheckins.find((checkin) => checkin.id === id) ?? null;
  }
}
