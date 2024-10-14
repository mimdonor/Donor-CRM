"use client";
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import AddItemDialog from "./AddItemDialog";
import { cn } from "@/lib/utils"; // Make sure to import the cn utility if not already imported
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SettingsCard = ({ title, table, showOrganization }) => {
  const [items, setItems] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    fetchItems();
  }, [table]);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching items:', error);
    } else {
      setItems(data);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const { error } = await supabase
      .from(table)
      .update({ status: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
    } else {
      setItems(items.map(item => 
        item.id === id ? { ...item, status: !currentStatus } : item
      ));
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting item:', error);
    } else {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleAddItem = async (newItem) => {
    const { data, error } = await supabase
      .from(table)
      .insert([newItem])
      .select();

    if (error) {
      console.error('Error adding item:', error);
    } else {
      setItems([...items, ...data]);
    }
  };

  const openDeleteDialog = (item) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await handleDelete(itemToDelete.id);
      closeDeleteDialog();
    }
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Button onClick={() => setIsDialogOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center p-2 border rounded">
            <div className="flex flex-col">
              <span>{item.name}</span>
              {showOrganization && item.organization && (
                <span className="text-sm text-gray-500">{item.organization}</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className={cn(
                "text-sm font-medium",
                item.status ? "text-green-500" : "text-red-500"
              )}>
                {item.status ? "Active" : "Inactive"}
              </span>
              <Switch
                checked={item.status}
                onCheckedChange={() => toggleStatus(item.id, item.status)}
                className={cn(
                  "data-[state=checked]:bg-green-500",
                  "data-[state=unchecked]:bg-red-500"
                )}
              />
              <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(item)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <AddItemDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAdd={handleAddItem}
        table={table}
      />
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this item?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the item
              "{itemToDelete?.name}" from the {title.toLowerCase()} list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SettingsCard;