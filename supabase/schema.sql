-- COMPLETE SCHEMA AND POLICIES
-- Run this in Supabase SQL Editor

-- Extensions
create extension if not exists "uuid-ossp";

-- 1. SCHOOLS
create table if not exists schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table schools enable row level security;

-- 2. USERS / PROFILES
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text check (role in ('admin', 'teacher')),
  school_id uuid references schools(id) not null,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table profiles enable row level security;

-- 3. CLASSES
create table if not exists classes (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) not null,
  name text not null,
  teacher_id uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table classes enable row level security;

-- 4. STUDENTS
create table if not exists students (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) not null,
  class_id uuid references classes(id) not null,
  name text not null,
  roll_no text,
  parent_email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table students enable row level security;

-- 5. EXAMS
create table if not exists exams (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) not null,
  class_id uuid references classes(id) not null,
  name text not null,
  date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table exams enable row level security;

-- 6. SUBJECTS
create table if not exists subjects (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table subjects enable row level security;

-- 7. MARKS
create table if not exists marks (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) not null,
  exam_id uuid references exams(id) not null,
  student_id uuid references students(id) not null,
  subject_id uuid references subjects(id) not null,
  score_obtained numeric not null,
  max_marks numeric not null default 100,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(exam_id, student_id, subject_id)
);
alter table marks enable row level security;

-- HELPER FUNCTIONS
create or replace function get_my_school_id()
returns uuid as $$
  select school_id from profiles where id = auth.uid()
$$ language sql security definer;

-- POLICIES

-- Schools:
-- Allow anyone authenticated to create a school (Signup flow)
create policy "Enable insert for authenticated users only" on schools for insert to authenticated with check (true);
-- Allow users to view their own school (this might need adjustment if queries are generic, but for now strict is good)
-- Actually, we need to read the school name in the dashboard.
create policy "Users can view their own school" on schools for select using (id = get_my_school_id());

-- Profiles:
-- Users can view profiles in their school
create policy "Users can view profiles from own school" on profiles for select using (school_id = get_my_school_id());
-- Users can insert their own profile (Signup flow)
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
-- Users can update own profile
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Classes:
create policy "View classes from own school" on classes for select using (school_id = get_my_school_id());
create policy "Manage classes from own school" on classes for all using (school_id = get_my_school_id());

-- Students:
create policy "View students from own school" on students for select using (school_id = get_my_school_id());
create policy "Manage students from own school" on students for all using (school_id = get_my_school_id());

-- Exams:
create policy "View exams from own school" on exams for select using (school_id = get_my_school_id());
create policy "Manage exams from own school" on exams for all using (school_id = get_my_school_id());

-- Subjects:
create policy "View subjects from own school" on subjects for select using (school_id = get_my_school_id());
create policy "Manage subjects from own school" on subjects for all using (school_id = get_my_school_id());

-- Marks:
create policy "View marks from own school" on marks for select using (school_id = get_my_school_id());
create policy "Manage marks from own school" on marks for all using (school_id = get_my_school_id());

