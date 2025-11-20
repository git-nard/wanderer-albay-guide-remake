import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface Accommodation {
  id: string;
  name: string;
  description: string;
  location: string;
  municipality: string;
  category: string[];
  image_url: string;
  contact_number: string;
  email: string;
  price_range: string;
  amenities: string[];
  rating: number;
}

interface Municipality {
  code: string;
  name: string;
}

interface Barangay {
  code: string;
  name: string;
}

const ManageAccommodations = () => {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    municipality: "",
    category: "",
    image_url: "",
    contact_number: "",
    email: "",
    price_range: "",
    amenities: "",
    rating: 0,
  });

  useEffect(() => {
    fetchAccommodations();
    fetchMunicipalities();
  }, []);

  const fetchAccommodations = async () => {
    const { data, error } = await supabase.from("accommodations").select("*").order("name");
    if (!error && data) setAccommodations(data);
  };

  const fetchMunicipalities = async () => {
    try {
      const [muniRes, cityRes] = await Promise.all([
        fetch("https://psgc.gitlab.io/api/provinces/050500000/municipalities/"),
        fetch("https://psgc.gitlab.io/api/provinces/050500000/cities/"),
      ]);
      const [muniData, cityData] = await Promise.all([muniRes.json(), cityRes.json()]);
      const merged = [...(muniData || []), ...(cityData || [])];
      const sorted = merged
        .map((m: any) => ({ code: m.code, name: m.name }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setMunicipalities(sorted);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load municipalities and cities");
    }
  };

  const fetchBarangays = async (code: string) => {
    try {
      let response = await fetch(`https://psgc.gitlab.io/api/municipalities/${code}/barangays/`);
      if (!response.ok) {
        response = await fetch(`https://psgc.gitlab.io/api/cities/${code}/barangays/`);
      }
      const data = await response.json();
      const sorted = (data || [])
        .map((b: any) => ({ code: b.code, name: b.name }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setBarangays(sorted);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load barangays");
    }
  };

  const handleMunicipalityChange = (code: string) => {
    const selected = municipalities.find((m) => m.code === code);
    setFormData({ ...formData, municipality: selected?.name || "", location: "" });
    setBarangays([]);
    if (code) fetchBarangays(code);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      location: "",
      municipality: "",
      category: "",
      image_url: "",
      contact_number: "",
      email: "",
      price_range: "",
      amenities: "",
      rating: 0,
    });
    setBarangays([]);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const accommodationData = {
      ...formData,
      category: formData.category.split(",").map((c) => c.trim()),
      amenities: formData.amenities.split(",").map((a) => a.trim()),
    };

    if (editingId) {
      const { error } = await supabase.from("accommodations").update(accommodationData).eq("id", editingId);
      if (error) toast.error("Failed to update accommodation");
      else {
        toast.success("Accommodation updated successfully");
        setIsOpen(false);
        resetForm();
        fetchAccommodations();
      }
    } else {
      const { error } = await supabase.from("accommodations").insert([accommodationData]);
      if (error) toast.error("Failed to add accommodation");
      else {
        toast.success("Accommodation added successfully");
        setIsOpen(false);
        resetForm();
        fetchAccommodations();
      }
    }
  };

  const handleEdit = (accommodation: Accommodation) => {
    setFormData({
      name: accommodation.name,
      description: accommodation.description || "",
      location: accommodation.location,
      municipality: accommodation.municipality || "",
      category: accommodation.category?.join(", ") || "",
      image_url: accommodation.image_url || "",
      contact_number: accommodation.contact_number || "",
      email: accommodation.email || "",
      price_range: accommodation.price_range || "",
      amenities: accommodation.amenities?.join(", ") || "",
      rating: accommodation.rating || 0,
    });
    setEditingId(accommodation.id);
    setIsOpen(true);
    if (accommodation.municipality) {
      const muni = municipalities.find((m) => m.name === accommodation.municipality);
      if (muni) fetchBarangays(muni.code);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this accommodation?")) return;
    const { error } = await supabase.from("accommodations").delete().eq("id", id);
    if (error) toast.error("Failed to delete accommodation");
    else {
      toast.success("Accommodation deleted successfully");
      fetchAccommodations();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Manage Accommodations</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" /> Add Accommodation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Accommodation" : "Add New Accommodation"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Municipality Dropdown */}
                <div>
                  <Label htmlFor="municipality">Municipality</Label>
                  <Select
                    onValueChange={handleMunicipalityChange}
                    value={municipalities.find((m) => m.name === formData.municipality)?.code || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Municipality" />
                    </SelectTrigger>
                    <SelectContent>
                      {municipalities.map((m) => (
                        <SelectItem key={m.code} value={m.code}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Dropdown */}
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select
                    onValueChange={(code) => {
                      const barangay = barangays.find((b) => b.code === code);
                      setFormData({ ...formData, location: barangay?.name || "" });
                    }}
                    value={barangays.find((b) => b.name === formData.location)?.code || ""}
                    disabled={!barangays.length}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={barangays.length ? "Location" : "Select municipality first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {barangays.map((b) => (
                        <SelectItem key={b.code} value={b.code}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="category">Categories (comma-separated)</Label>
                <Input
                  id="category"
                  placeholder="Luxury, Beach Resort, All-Inclusive"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                <Input
                  id="amenities"
                  placeholder="WiFi, Pool, Restaurant, Spa"
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_range">Price Range</Label>
                  <Input
                    id="price_range"
                    placeholder="₱1,500 - ₱3,000"
                    value={formData.price_range}
                    onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="rating">Rating (0-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_number">Contact Number</Label>
                  <Input
                    id="contact_number"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">{editingId ? "Update" : "Add"} Accommodation</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accommodations.map((accommodation) => (
          <Card key={accommodation.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{accommodation.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {accommodation.municipality || accommodation.location}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" onClick={() => handleEdit(accommodation)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => handleDelete(accommodation.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {accommodation.image_url ? (
                <img
                  src={accommodation.image_url}
                  alt={accommodation.name}
                  className="w-full h-32 object-cover rounded mb-3"
                />
              ) : (
                <div className="w-full h-32 bg-muted rounded mb-3 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{accommodation.description}</p>
              {accommodation.price_range && <p className="text-sm font-semibold mb-2">{accommodation.price_range}</p>}
              {accommodation.category && accommodation.category.length > 0 && (
                <p className="text-xs text-muted-foreground">{accommodation.category.join(", ")}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ManageAccommodations;
