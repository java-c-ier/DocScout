import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── Hospital helpers ──────────────────────────────────────────────────────────

export const addHospital = async (hospital, csvFileName) => {
  const district = csvFileName
    ? csvFileName.replace(/\.[^/.]+$/, '').trim()
    : 'Unknown District';

  const { error } = await supabase.from('hospitals').upsert(
    {
      name: hospital.Name ? hospital.Name.trim() : 'NA',
      district,
      state: 'Odisha',
      website: hospital.Website ? hospital.Website.trim() : '',
      rating: hospital.Rating ? parseFloat(hospital.Rating) : 0,
      type: hospital.Type ? hospital.Type.trim() : '',
      contact: hospital.Contact ? hospital.Contact.trim() : 'NA',
      google_map_link: hospital.GoogleMapLink ? hospital.GoogleMapLink.trim() : '',
    },
    { onConflict: 'name,district' }
  );
  if (error) console.error(`Error adding ${hospital.Name}:`, error.message);
};

// ── Review helpers ────────────────────────────────────────────────────────────
// Each review is its own row in the reviews table (normalized).
// star_rating is filled after sentiment analysis.

export const addReview = async (hospitalId, aspect, reviewText, userId = null) => {
  const { error } = await supabase.from('reviews').insert({
    hospital_id: hospitalId,
    user_id: userId,
    aspect,
    text: reviewText.trim(),
  });
  if (error) console.error('Error adding review:', error.message);
};

// Fetch all review texts for a hospital grouped by aspect
export const getReviewsByAspect = async (hospitalId) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('aspect, text')
    .eq('hospital_id', hospitalId);

  if (error) { console.error('Error fetching reviews:', error.message); return {}; }

  const grouped = {};
  for (const row of data || []) {
    if (!grouped[row.aspect]) grouped[row.aspect] = [];
    grouped[row.aspect].push(row.text);
  }
  return grouped;
};

// ── Doctor helpers ────────────────────────────────────────────────────────────
// Looks up hospital by name+district, then upserts the doctor row.
// No longer writes back to hospitals.departments[] — derive via hospital_departments view.

export const addDoctor = async (doctorData) => {
  const { Name, Qualification, Experience, Department, Specialization, Timing, District, Hospital } = doctorData;
  if (!District || !Hospital || !Department) {
    console.error('Missing required fields');
    return { success: false, reason: 'Missing required fields (District, Hospital, or Department)' };
  }

  const { data: hosp, error: hospErr } = await supabase
    .from('hospitals')
    .select('id')
    .eq('district', District.trim())
    .ilike('name', Hospital.trim())
    .single();
  if (hospErr || !hosp) {
    console.error('Hospital not found:', Hospital, hospErr?.message);
    return { success: false, reason: `Hospital not found: ${Hospital} (${District})` };
  }

  const { data: dept, error: deptErr } = await supabase
    .from('departments')
    .upsert({ hospital_id: hosp.id, name: Department.trim() }, { onConflict: 'hospital_id,name' })
    .select('id')
    .single();
  if (deptErr || !dept) {
    console.error('Could not create department:', Department, deptErr?.message);
    return { success: false, reason: `Could not create department: ${Department}` };
  }

  const { error } = await supabase.from('doctors').upsert(
    {
      department_id: dept.id,
      name: Name?.trim() || '',
      qualification: Qualification?.trim() || '',
      experience: Experience?.trim() || '',
      specialization: Specialization?.trim() || '',
      timing: Timing?.trim() || '',
    },
    { onConflict: 'department_id,name' }
  );
  if (error) {
    console.error('Error adding doctor:', error.message);
    return { success: false, reason: `Error adding doctor: ${error.message}` };
  }
  return { success: true };
};
