import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { State, City } from "country-state-city";
import { supabase } from "@/lib/supabase";

const AddItemDialog = ({ isOpen, onClose, onAdd, table }) => {
  const [newItem, setNewItem] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    // Get all states of India
    const allStates = State.getStatesOfCountry("IN");
    setStates(allStates);
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedState) {
      // Get all cities (districts) of the selected state
      const allDistricts = City.getCitiesOfState("IN", selectedState);
      setDistricts(allDistricts);
    } else {
      setDistricts([]);
    }
  }, [selectedState]);

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from("organization_settings")
      .select("id, name");

    if (error) {
      console.error("Error fetching organizations:", error);
    } else {
      setOrganizations(data);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newItem.trim()) {
      const itemToAdd = { name: newItem, status: true };
      if (table === 'donorzone_dropdown') {
        itemToAdd.state = states.find(state => state.isoCode === selectedState)?.name || "";
        itemToAdd.district = selectedDistrict;
      } else if (table === 'purposes_dropdown') {
        itemToAdd.organization = selectedOrganization;
      }
      onAdd(itemToAdd);
      setNewItem("");
      setSelectedState("");
      setSelectedDistrict("");
      setSelectedOrganization("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[425px] sm:max-w-[500px] text-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">
                Name
              </Label>
              <Input
                id="name"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                className="text-gray-900 dark:text-gray-100"
              />
            </div>
            {table === 'donorzone_dropdown' && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="state">
                    State
                  </Label>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state.isoCode} value={state.isoCode}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="district" className="">
                    District
                  </Label>
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district.name} value={district.name}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {table === 'purposes_dropdown' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="organization" className="">
                  Organization
                </Label>
                <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.name.toString()}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit">Add Item</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;