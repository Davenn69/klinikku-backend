import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { db } from "./index";
import {
  appointmentSlots,
  doctors,
  encounters,
  regions,
  users,
} from "./schema";
import { hashPassword } from "../utils/auth";

const DEFAULT_PASSWORD = "password123";

const regionSeeds = [
  { id: "a1000000-0000-0000-0000-000000000001", name: "Surabaya", code: "reg_sby" },
  { id: "a1000000-0000-0000-0000-000000000002", name: "Jakarta", code: "reg_jkt" },
  { id: "a1000000-0000-0000-0000-000000000003", name: "Bandung", code: "reg_bdg" },
  { id: "a1000000-0000-0000-0000-000000000004", name: "Bali", code: "reg_bali" },
  { id: "a1000000-0000-0000-0000-000000000005", name: "Medan", code: "reg_mdn" },
] as const;

const userSeeds = [
  {
    id: "b1000000-0000-0000-0000-000000000001",
    name: "Admin Klinik",
    email: "admin@klinik.id",
    role: "admin" as const,
  },
  {
    id: "b1000000-0000-0000-0000-000000000002",
    name: "Budi Santoso",
    email: "budi@example.com",
    role: "patient" as const,
  },
  {
    id: "b1000000-0000-0000-0000-000000000003",
    name: "Siti Rahayu",
    email: "siti@example.com",
    role: "patient" as const,
  },
  {
    id: "b1000000-0000-0000-0000-000000000004",
    name: "Ahmad Fauzi",
    email: "ahmad@example.com",
    role: "patient" as const,
  },
] as const;

const doctorSeeds = [
  {
    id: "c1000000-0000-0000-0000-000000000001",
    name: "dr. Andi Wijaya, Sp.PD",
    specialization: "Penyakit Dalam",
    regionId: "a1000000-0000-0000-0000-000000000001",
    licenseNumber: "SIP-001-SBY",
  },
  {
    id: "c1000000-0000-0000-0000-000000000002",
    name: "dr. Nina Kusuma, Sp.A",
    specialization: "Anak",
    regionId: "a1000000-0000-0000-0000-000000000001",
    licenseNumber: "SIP-002-SBY",
  },
  {
    id: "c1000000-0000-0000-0000-000000000003",
    name: "dr. Rizki Pratama, Sp.OG",
    specialization: "Kandungan",
    regionId: "a1000000-0000-0000-0000-000000000001",
    licenseNumber: "SIP-003-SBY",
  },
  {
    id: "c1000000-0000-0000-0000-000000000004",
    name: "dr. Dewi Anggraeni, Sp.JP",
    specialization: "Jantung",
    regionId: "a1000000-0000-0000-0000-000000000002",
    licenseNumber: "SIP-001-JKT",
  },
  {
    id: "c1000000-0000-0000-0000-000000000005",
    name: "dr. Hendra Gunawan, Sp.N",
    specialization: "Neurologi",
    regionId: "a1000000-0000-0000-0000-000000000002",
    licenseNumber: "SIP-002-JKT",
  },
  {
    id: "c1000000-0000-0000-0000-000000000006",
    name: "dr. Rina Agustina, Sp.KK",
    specialization: "Kulit & Kelamin",
    regionId: "a1000000-0000-0000-0000-000000000003",
    licenseNumber: "SIP-001-BDG",
  },
  {
    id: "c1000000-0000-0000-0000-000000000007",
    name: "dr. Made Suarjana, Sp.B",
    specialization: "Bedah Umum",
    regionId: "a1000000-0000-0000-0000-000000000004",
    licenseNumber: "SIP-001-BALI",
  },
  {
    id: "c1000000-0000-0000-0000-000000000008",
    name: "dr. Putri Siregar, Sp.M",
    specialization: "Mata",
    regionId: "a1000000-0000-0000-0000-000000000005",
    licenseNumber: "SIP-001-MDN",
  },
] as const;

const appointmentSlotSeeds = [
  {
    id: "d1000000-0000-0000-0000-000000000001",
    doctorId: "c1000000-0000-0000-0000-000000000001",
    regionId: "a1000000-0000-0000-0000-000000000001",
    slotDate: "2026-04-07",
    startTime: "08:00",
    endTime: "08:30",
    isAvailable: true,
    maxCapacity: 1,
    bookedCount: 0,
  },
  {
    id: "d1000000-0000-0000-0000-000000000002",
    doctorId: "c1000000-0000-0000-0000-000000000001",
    regionId: "a1000000-0000-0000-0000-000000000001",
    slotDate: "2026-04-07",
    startTime: "08:30",
    endTime: "09:00",
    isAvailable: true,
    maxCapacity: 1,
    bookedCount: 0,
  },
  {
    id: "d1000000-0000-0000-0000-000000000003",
    doctorId: "c1000000-0000-0000-0000-000000000001",
    regionId: "a1000000-0000-0000-0000-000000000001",
    slotDate: "2026-04-07",
    startTime: "09:00",
    endTime: "09:30",
    isAvailable: true,
    maxCapacity: 1,
    bookedCount: 0,
  },
  {
    id: "d1000000-0000-0000-0000-000000000004",
    doctorId: "c1000000-0000-0000-0000-000000000001",
    regionId: "a1000000-0000-0000-0000-000000000001",
    slotDate: "2026-04-07",
    startTime: "09:30",
    endTime: "10:00",
    isAvailable: true,
    maxCapacity: 1,
    bookedCount: 0,
  },
  {
    id: "d1000000-0000-0000-0000-000000000005",
    doctorId: "c1000000-0000-0000-0000-000000000002",
    regionId: "a1000000-0000-0000-0000-000000000001",
    slotDate: "2026-04-07",
    startTime: "10:00",
    endTime: "10:30",
    isAvailable: true,
    maxCapacity: 1,
    bookedCount: 0,
  },
  {
    id: "d1000000-0000-0000-0000-000000000006",
    doctorId: "c1000000-0000-0000-0000-000000000002",
    regionId: "a1000000-0000-0000-0000-000000000001",
    slotDate: "2026-04-07",
    startTime: "10:30",
    endTime: "11:00",
    isAvailable: true,
    maxCapacity: 1,
    bookedCount: 0,
  },
  {
    id: "d1000000-0000-0000-0000-000000000007",
    doctorId: "c1000000-0000-0000-0000-000000000004",
    regionId: "a1000000-0000-0000-0000-000000000002",
    slotDate: "2026-04-07",
    startTime: "13:00",
    endTime: "13:30",
    isAvailable: true,
    maxCapacity: 1,
    bookedCount: 0,
  },
  {
    id: "d1000000-0000-0000-0000-000000000008",
    doctorId: "c1000000-0000-0000-0000-000000000004",
    regionId: "a1000000-0000-0000-0000-000000000002",
    slotDate: "2026-04-07",
    startTime: "13:30",
    endTime: "14:00",
    isAvailable: true,
    maxCapacity: 1,
    bookedCount: 0,
  },
  {
    id: "d1000000-0000-0000-0000-000000000009",
    doctorId: "c1000000-0000-0000-0000-000000000006",
    regionId: "a1000000-0000-0000-0000-000000000003",
    slotDate: "2026-04-07",
    startTime: "09:00",
    endTime: "09:30",
    isAvailable: true,
    maxCapacity: 1,
    bookedCount: 0,
  },
  {
    id: "d1000000-0000-0000-0000-000000000010",
    doctorId: "c1000000-0000-0000-0000-000000000001",
    regionId: "a1000000-0000-0000-0000-000000000001",
    slotDate: "2026-04-08",
    startTime: "08:00",
    endTime: "08:30",
    isAvailable: true,
    maxCapacity: 1,
    bookedCount: 0,
  },
  {
    id: "d1000000-0000-0000-0000-000000000011",
    doctorId: "c1000000-0000-0000-0000-000000000001",
    regionId: "a1000000-0000-0000-0000-000000000001",
    slotDate: "2026-04-08",
    startTime: "08:30",
    endTime: "09:00",
    isAvailable: true,
    maxCapacity: 1,
    bookedCount: 0,
  },
  {
    id: "d1000000-0000-0000-0000-000000000012",
    doctorId: "c1000000-0000-0000-0000-000000000005",
    regionId: "a1000000-0000-0000-0000-000000000002",
    slotDate: "2026-04-08",
    startTime: "14:00",
    endTime: "14:30",
    isAvailable: true,
    maxCapacity: 1,
    bookedCount: 0,
  },
  {
    id: "d1000000-0000-0000-0000-000000000013",
    doctorId: "c1000000-0000-0000-0000-000000000005",
    regionId: "a1000000-0000-0000-0000-000000000002",
    slotDate: "2026-04-08",
    startTime: "14:30",
    endTime: "15:00",
    isAvailable: true,
    maxCapacity: 1,
    bookedCount: 0,
  },
  {
    id: "d1000000-0000-0000-0000-000000000014",
    doctorId: "c1000000-0000-0000-0000-000000000002",
    regionId: "a1000000-0000-0000-0000-000000000001",
    slotDate: "2026-04-07",
    startTime: "11:00",
    endTime: "11:30",
    isAvailable: true,
    maxCapacity: 1,
    bookedCount: 0,
  },
] as const;

const encounterSeeds = [
  {
    id: "e1000000-0000-0000-0000-000000000001",
    bookingCode: "BKG-20260407-001",
    userId: "b1000000-0000-0000-0000-000000000002",
    doctorId: "c1000000-0000-0000-0000-000000000002",
    regionId: "a1000000-0000-0000-0000-000000000001",
    appointmentSlotId: "d1000000-0000-0000-0000-000000000014",
    complaint: "Anak demam 2 hari, nafsu makan menurun",
    status: "BOOKED" as const,
  },
  {
    id: "e1000000-0000-0000-0000-000000000002",
    bookingCode: "BKG-20260407-002",
    userId: "b1000000-0000-0000-0000-000000000003",
    doctorId: "c1000000-0000-0000-0000-000000000004",
    regionId: "a1000000-0000-0000-0000-000000000002",
    appointmentSlotId: "d1000000-0000-0000-0000-000000000007",
    complaint: "Nyeri dada kiri sejak kemarin",
    status: "CONFIRMED" as const,
  },
  {
    id: "e1000000-0000-0000-0000-000000000003",
    bookingCode: "BKG-20260301-001",
    userId: "b1000000-0000-0000-0000-000000000002",
    doctorId: "c1000000-0000-0000-0000-000000000001",
    regionId: "a1000000-0000-0000-0000-000000000001",
    appointmentSlotId: "d1000000-0000-0000-0000-000000000001",
    complaint: "Kontrol gula darah rutin",
    status: "COMPLETED" as const,
  },
  {
    id: "e1000000-0000-0000-0000-000000000004",
    bookingCode: "BKG-20260320-001",
    userId: "b1000000-0000-0000-0000-000000000002",
    doctorId: "c1000000-0000-0000-0000-000000000006",
    regionId: "a1000000-0000-0000-0000-000000000003",
    appointmentSlotId: "d1000000-0000-0000-0000-000000000009",
    complaint: "Ruam kulit di lengan",
    status: "CANCELLED" as const,
  },
] as const;

const ensureRegion = async (seed: (typeof regionSeeds)[number]) => {
  const existing = await db.query.regions.findFirst({
    where: eq(regions.id, seed.id),
  });

  if (existing) return existing;

  const [created] = await db.insert(regions).values(seed).returning();
  if (!created) throw new Error(`Failed to seed region ${seed.id}`);
  return created;
};

const ensureUser = async (
  seed: (typeof userSeeds)[number],
  passwordHash: string,
) => {
  const existing = await db.query.users.findFirst({
    where: eq(users.id, seed.id),
  });

  if (existing) return existing;

  const [created] = await db
    .insert(users)
    .values({
      ...seed,
      passwordHash,
      isActive: true,
    })
    .returning();

  if (!created) throw new Error(`Failed to seed user ${seed.id}`);
  return created;
};

const ensureDoctor = async (seed: (typeof doctorSeeds)[number]) => {
  const existing = await db.query.doctors.findFirst({
    where: eq(doctors.id, seed.id),
  });

  if (existing) return existing;

  const [created] = await db
    .insert(doctors)
    .values({
      ...seed,
      isActive: true,
    })
    .returning();

  if (!created) throw new Error(`Failed to seed doctor ${seed.id}`);
  return created;
};

const ensureAppointmentSlot = async (
  seed: (typeof appointmentSlotSeeds)[number],
) => {
  const existing = await db.query.appointmentSlots.findFirst({
    where: eq(appointmentSlots.id, seed.id),
  });

  if (existing) {
    const [updated] = await db
      .update(appointmentSlots)
      .set({
        doctorId: seed.doctorId,
        regionId: seed.regionId,
        slotDate: seed.slotDate,
        startTime: seed.startTime,
        endTime: seed.endTime,
        isAvailable: seed.isAvailable,
        maxCapacity: seed.maxCapacity,
        bookedCount: seed.bookedCount,
      })
      .where(eq(appointmentSlots.id, seed.id))
      .returning();

    if (!updated) throw new Error(`Failed to refresh appointment slot ${seed.id}`);
    return updated;
  }

  const [created] = await db.insert(appointmentSlots).values(seed).returning();
  if (!created) throw new Error(`Failed to seed appointment slot ${seed.id}`);
  return created;
};

const ensureEncounter = async (seed: (typeof encounterSeeds)[number]) => {
  const existing = await db.query.encounters.findFirst({
    where: eq(encounters.id, seed.id),
  });

  if (existing) return existing;

  const [created] = await db.insert(encounters).values(seed).returning();
  if (!created) throw new Error(`Failed to seed encounter ${seed.id}`);
  return created;
};

const syncAppointmentSlotAvailability = async () => {
  await db.execute(sql`
    UPDATE appointment_slots AS slot
    SET
      booked_count = COALESCE((
        SELECT COUNT(*)
        FROM encounters AS enc
        WHERE enc.appointment_slot_id = slot.id
          AND enc.status = 'BOOKED'
      ), 0),
      is_available = COALESCE((
        SELECT COUNT(*)
        FROM encounters AS enc
        WHERE enc.appointment_slot_id = slot.id
          AND enc.status = 'BOOKED'
      ), 0) < slot.max_capacity
  `);
};

const seed = async () => {
  console.log("Seeding database from drizzle/0002_seed_data.sql...");

  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  for (const region of regionSeeds) {
    await ensureRegion(region);
  }

  for (const user of userSeeds) {
    await ensureUser(user, passwordHash);
  }

  for (const doctor of doctorSeeds) {
    await ensureDoctor(doctor);
  }

  for (const slot of appointmentSlotSeeds) {
    await ensureAppointmentSlot(slot);
  }

  for (const encounter of encounterSeeds) {
    await ensureEncounter(encounter);
  }

  await syncAppointmentSlotAvailability();

  console.log("Seed completed successfully.");
  console.log({
    source: "drizzle/0002_seed_data.sql",
    defaultPassword: DEFAULT_PASSWORD,
    note: "Password hash was regenerated with the app's scrypt auth helper.",
  });
};

seed()
  .catch((error) => {
    console.error("Seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end();
  });
