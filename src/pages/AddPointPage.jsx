import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Upload, MapPin, X } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMapEvent } from 'react-leaflet'
import L from 'leaflet'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'
import { Input, Textarea, Button, Field } from '../components/ui'

const MAX_IMAGES   = 10
const MAX_FILE_MB  = 5
const MAX_FILE_SIZE = MAX_FILE_MB * 1024 * 1024

// Pure validators → enables real-time (on-change / on-blur) validation.
function validate(form, pickedLocation) {
  const e = {}
  if (!form.name.trim())                       e.name        = 'יש להזין את שם האתר'
  else if (form.name.trim().length < 2)        e.name        = 'השם קצר מדי'
  if (!pickedLocation)                         e.location    = 'יש לבחור מיקום על המפה'
  if (form.description.trim().length < 10)     e.description  = 'התיאור חייב להכיל לפחות 10 תווים'
  return e
}

export default function AddPointPage() {
  const navigate    = useNavigate()
  const { addMemorial } = useApp()
  const toast = useToast()

  const [form,           setForm          ] = useState({ name: '', description: '' })
  const [images,         setImages        ] = useState([])
  const [isSubmitting,   setIsSubmitting  ] = useState(false)
  const [pickedLocation, setPickedLocation] = useState(null)
  const [mapModalOpen,   setMapModalOpen  ] = useState(false)
  const [touched,        setTouched       ] = useState({})

  const errors  = validate(form, pickedLocation)
  const showErr = key => (touched[key] ? errors[key] : undefined)

  // Revoke object URLs only on unmount (kept in a ref so the effect stays
  // mount-only — avoids the classic "revoke a still-mounted URL" bug).
  const imagesRef = useRef(images)
  imagesRef.current = images
  useEffect(() => () => imagesRef.current.forEach(img => URL.revokeObjectURL(img.url)), [])

  const handleChange = useCallback(e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }, [])

  const markTouched = useCallback(e => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }))
  }, [])

  const handleImages = useCallback(e => {
    const incoming = Array.from(e.target.files)
    e.target.value = '' // allow re-selecting the same file later
    const accepted = []
    const rejected = []
    for (const f of incoming) {
      if (!f.type.startsWith('image/'))      rejected.push(`${f.name} — קובץ שאינו תמונה`)
      else if (f.size > MAX_FILE_SIZE)       rejected.push(`${f.name} — גדול מ-${MAX_FILE_MB}MB`)
      else accepted.push({ url: URL.createObjectURL(f), file: f, id: `${f.name}-${f.size}-${f.lastModified}` })
    }
    if (rejected.length) toast.error(`חלק מהקבצים נדחו: ${rejected.join(' · ')}`)

    setImages(prev => {
      const room = MAX_IMAGES - prev.length
      if (room <= 0) { toast.error(`ניתן להעלות עד ${MAX_IMAGES} תמונות`); return prev }
      const slice = accepted.slice(0, room)
      if (accepted.length > room) toast.info(`נוספו ${room} תמונות בלבד (מקסימום ${MAX_IMAGES})`)
      return [...prev, ...slice]
    })
  }, [toast])

  const removeImage = useCallback(id => {
    setImages(prev => {
      const target = prev.find(img => img.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter(img => img.id !== id)
    })
  }, [])

  const handleSubmit = useCallback(async e => {
    e.preventDefault()
    if (isSubmitting) return  // guard against double-submit (Enter while in-flight)
    setTouched({ name: true, location: true, description: true })
    if (Object.keys(validate(form, pickedLocation)).length > 0) return

    setIsSubmitting(true)
    try {
      await addMemorial({
        name:        form.name.trim(),
        description: form.description.trim(),
        location:    pickedLocation,
        imageFiles:  images.map(img => img.file),
      })
      images.forEach(img => URL.revokeObjectURL(img.url))
      setForm({ name: '', description: '' })
      setImages([])
      setPickedLocation(null)
      toast.success('תודה! הנקודה נשלחה לבדיקה ותופיע במפה לאחר אישור המערכת.')
      navigate('/map')
    } catch (err) {
      toast.error(err.message ?? 'שגיאה בשמירת הנקודה. נסה שנית.')
    } finally {
      setIsSubmitting(false)
    }
  }, [navigate, addMemorial, form, pickedLocation, images, toast, isSubmitting])

  return (
    <div dir="rtl" className="flex flex-col min-h-full">

      {/* ── Page header ── */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-0.5 text-olive-700 text-sm font-semibold
                     active:opacity-70 transition-opacity"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
          חזרה
        </button>
        <h1 className="flex-1 text-right text-lg font-bold text-slate-800 pe-1">
          הוסף נקודה חדשה
        </h1>
      </div>
      <hr className="border-slate-100" />

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} noValidate className="flex-1 px-5 pt-6 pb-8 flex flex-col gap-6">

        <Input
          label="שם האנדרטה / האתר"
          name="name"
          required
          value={form.name}
          onChange={handleChange}
          onBlur={markTouched}
          placeholder="לדוגמה: מצפה דני כהן"
          error={showErr('name')}
        />

        {/* Map location picker */}
        <Field label="מיקום על המפה" required error={showErr('location')}>
          <div
            onClick={() => setMapModalOpen(true)}
            className={`relative h-36 rounded-2xl overflow-hidden border cursor-pointer
                        ${showErr('location') ? 'border-red-300' : 'border-slate-200'}`}
          >
            <img
              src="https://picsum.photos/seed/mapplaceholder/800/300"
              alt="מיקום"
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="w-11 h-11 rounded-full bg-olive-700/90 shadow-md flex items-center justify-center">
                <MapPin size={22} className="text-white" strokeWidth={2} />
              </div>
              <span className="text-sm font-semibold text-slate-800 bg-white/85 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                {pickedLocation
                  ? `📍 ${pickedLocation.lat}, ${pickedLocation.lng}`
                  : 'לחץ לבחירת מיקום'}
              </span>
            </div>
          </div>
        </Field>

        {/* Image upload */}
        <Field label="תמונות" hint={`JPG, PNG · עד ${MAX_FILE_MB}MB לתמונה · עד ${MAX_IMAGES} תמונות`}>
          <label
            htmlFor="img-upload"
            className="flex flex-col items-center justify-center gap-2 py-7
                       border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50
                       cursor-pointer hover:border-olive-400 hover:bg-olive-50
                       transition-all duration-150"
          >
            <Upload size={28} className="text-slate-400" strokeWidth={1.5} />
            <p className="text-sm font-medium text-slate-600">הוסף תמונות לאתר</p>
            <input
              type="file"
              id="img-upload"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleImages}
            />
          </label>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {images.map(img => (
                <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    aria-label="הסר תמונה"
                    className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full
                               bg-black/55 text-white flex items-center justify-center
                               hover:bg-black/75 active:scale-90 transition-all"
                  >
                    <X size={13} strokeWidth={2.6} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Field>

        <Textarea
          label="תיאור / סיפור ההנצחה"
          name="description"
          required
          rows={5}
          value={form.description}
          onChange={handleChange}
          onBlur={markTouched}
          placeholder="ספר את הסיפור מאחורי המקום..."
          error={showErr('description')}
        />

        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          {isSubmitting ? 'שולח...' : 'שלח לאישור'}
        </Button>
      </form>

      <MapPickerModal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        onConfirm={loc => setPickedLocation(loc)}
      />
    </div>
  )
}

// ── Inner map click handler ───────────────────────────────────────────────────
function LocationPickerMap({ onPick }) {
  useMapEvent('click', e => {
    onPick({ lat: e.latlng.lat.toFixed(5), lng: e.latlng.lng.toFixed(5) })
  })
  return null
}

// ── Full-screen map picker bottom-sheet ───────────────────────────────────────
function MapPickerModal({ isOpen, onClose, onConfirm }) {
  const [tempLocation, setTempLocation] = useState(null)

  useEffect(() => {
    if (isOpen) setTempLocation(null)
  }, [isOpen])

  if (!isOpen) return null

  const ISRAEL_CENTER = [31.5, 35.0]

  return (
    <>
      <div className="fixed inset-0 z-[2000] bg-black/60" onClick={onClose} />
      <div
        dir="rtl"
        className="fixed bottom-0 left-0 right-0 z-[2001] bg-white rounded-t-2xl flex flex-col"
        style={{ height: '85vh', animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-0 flex-shrink-0" />
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 flex-shrink-0">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} strokeWidth={2} />
          </button>
          <h2 className="text-base font-bold text-slate-800">בחר מיקום על המפה</h2>
          <div className="w-6" />
        </div>
        <p className="text-xs text-slate-400 text-center py-2 flex-shrink-0">
          {tempLocation
            ? `נבחר: ${tempLocation.lat}, ${tempLocation.lng}`
            : 'לחץ על המפה לבחירת מיקום'}
        </p>
        <div className="flex-1 relative">
          <MapContainer
            center={ISRAEL_CENTER}
            zoom={7}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© OpenStreetMap'
            />
            <LocationPickerMap onPick={setTempLocation} />
            {tempLocation && (
              <Marker
                position={[parseFloat(tempLocation.lat), parseFloat(tempLocation.lng)]}
                icon={L.divIcon({
                  className: '',
                  html: `<div style="width:24px;height:30px;position:relative;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" style="width:24px;height:30px;">
                      <path d="M16 0C7.163 0 0 7.163 0 16c0 10.667 16 24 16 24S32 26.667 32 16C32 7.163 24.837 0 16 0z" fill="#4c5a28"/>
                    </svg>
                  </div>`,
                  iconSize: [24, 30],
                  iconAnchor: [12, 30],
                })}
              />
            )}
          </MapContainer>
        </div>
        <div className="px-5 py-4 border-t border-slate-200 flex-shrink-0">
          <Button
            fullWidth
            rounded="full"
            disabled={!tempLocation}
            onClick={() => { if (tempLocation) { onConfirm(tempLocation); onClose() } }}
          >
            אשר מיקום
          </Button>
        </div>
      </div>
    </>
  )
}
