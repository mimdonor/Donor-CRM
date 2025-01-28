'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const Permissions = () => {
  const [selectedRole, setSelectedRole] = useState("Full Time");
  const [donorModule, setDonorModule] = useState({
    allowAccess: false,
    canAdd: false,
    canEdit: false,
    onlyView: false,
    canDelete: false,
    canPrint: false,
  });
  const [donationsModule, setDonationsModule] = useState({
    allowAccess: false,
    canAdd: false,
    canEdit: false,
    onlyView: false,
    canDelete: false,
    canPrint: false,
  });
  const [reportsModule, setReportsModule] = useState({
    allowAccess: false,
    canPrint: false,
    onlyView: false,
  });

  useEffect(() => {
    fetchPermissions(selectedRole);
  }, [selectedRole]);

  const fetchPermissions = async (role) => {
    const { data, error } = await supabase
      .from('roles')
      .select('permissions')
      .eq('role_name', role)
      .single();

    if (error) {
      console.error('Error fetching permissions:', error);
    } else if (data) {
      const permissions = data.permissions;
      setDonorModule(permissions.donorModule || {
        allowAccess: false,
        canAdd: false,
        canEdit: false,
        onlyView: false,
        canDelete: false,
        canPrint: false,
      });
      setDonationsModule(permissions.donationsModule || {
        allowAccess: false,
        canAdd: false,
        canEdit: false,
        onlyView: false,
        canDelete: false,
        canPrint: false,
      });
      setReportsModule(permissions.reportsModule || {
        allowAccess: false,
        canPrint: false,
        onlyView: false,
      });
    }
  };

  const handleToggle = (module, field, setModule) => {
    const updateModule = { ...module, [field]: !module[field] };
    if (field === 'allowAccess' && !updateModule.allowAccess) {
      updateModule.canAdd = false;
      updateModule.canEdit = false;
      updateModule.onlyView = false;
      updateModule.canDelete = false;
      updateModule.canPrint = false;
    }
    setModule(updateModule);
  };

  const handleEnableAll = (module, setModule) => {
    const enableAll = !module.allowAccess;
    setModule({
      allowAccess: enableAll,
      canAdd: enableAll,
      canEdit: enableAll,
      onlyView: enableAll,
      canDelete: enableAll,
      canPrint: enableAll,
    });
  };

  const handleIndividualToggle = (module, field, setModule) => {
    const updateModule = { ...module, [field]: !module[field] };
    if (!updateModule[field]) {
      setModule((prevModule) => ({
        ...prevModule,
        allowAccess: false,
      }));
    }
    setModule(updateModule);
  };

  const handleAllowAccessToggle = (module, setModule) => {
    const updateModule = { ...module, allowAccess: !module.allowAccess };
    if (!updateModule.allowAccess) {
      updateModule.canAdd = false;
      updateModule.canEdit = false;
      updateModule.onlyView = false;
      updateModule.canDelete = false;
      updateModule.canPrint = false;
    }
    setModule(updateModule);
  };

  const handleEnableAllReports = () => {
    const enableAll = !reportsModule.allowAccess;
    setReportsModule({
      allowAccess: enableAll,
      canPrint: enableAll,
      onlyView: enableAll,
    });
  };

  const handleAllowAccessToggleReports = () => {
    const updateModule = { ...reportsModule, allowAccess: !reportsModule.allowAccess };
    if (!updateModule.allowAccess) {
      updateModule.canPrint = false;
      updateModule.onlyView = false;
    }
    setReportsModule(updateModule);
  };

  const handleIndividualToggleReports = (field) => {
    const updateModule = { ...reportsModule, [field]: !reportsModule[field] };
    if (!updateModule[field]) {
      setReportsModule((prevModule) => ({
        ...prevModule,
        allowAccess: false,
      }));
    }
    setReportsModule(updateModule);
  };

  const handleSave = async () => {
    const permissionsArray = {
      donorModule,
      donationsModule,
      reportsModule,
    };
    console.log("permissions array", permissionsArray);

    const { error } = await supabase
      .from('roles')
      .update({ permissions: permissionsArray })
      .eq('role_name', selectedRole);

    if (error) {
      console.error('Error updating permissions:', error);
    } else {
      console.log('Permissions updated successfully');
    }
  };

  const handleCancel = () => {
    // Implement cancel functionality
    console.log('Cancel clicked');
  };

  return (
    <Card className="w-full max-w-5xl mx-auto mt-4">
      <CardHeader className="flex flex-row justify-between items-center">
        <div className="flex flex-col">
          <CardTitle className="text-2xl">Set Permissions</CardTitle>
          <span className="text-gray-500 text-sm">Modify access and permissions for teams and individuals.</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-500">Select Role</span>
          <Select onValueChange={setSelectedRole} value={selectedRole}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Promotional">Promotional</SelectItem>
              <SelectItem value="State co-ordinator">State co-ordinator</SelectItem>
              <SelectItem value="Zonal co-ordinator">Zonal co-ordinator</SelectItem>
              <SelectItem value="Regional co-ordinator">Regional co-ordinator</SelectItem>
              <SelectItem value="Full Time">Full Time</SelectItem>
              <SelectItem value="Part Time">Part Time</SelectItem>
              <SelectItem value="Volunteer">Volunteer</SelectItem>
              <SelectItem value="Office Staff">Office Staff</SelectItem>
              <SelectItem value="Representative">Representative</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <Separator className="mb-6" />
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-7">
              <CardTitle>Donor Module</CardTitle>
              <div className="flex items-center space-x-2">
                <Label>Enable all</Label>
                <Switch checked={donorModule.allowAccess && donorModule.canAdd && donorModule.canEdit && donorModule.onlyView && donorModule.canDelete && donorModule.canPrint} onCheckedChange={() => handleEnableAll(donorModule, setDonorModule)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Label className="whitespace-nowrap w-32">Allow Access</Label>
                <Switch
                  checked={donorModule.allowAccess}
                  onCheckedChange={() => handleAllowAccessToggle(donorModule, setDonorModule)}
                />
              </div>
              {['canAdd', 'canEdit', 'onlyView', 'canDelete', 'canPrint'].map((field) => (
                <div key={field} className="flex items-center space-x-2">
                  <Label className="whitespace-nowrap w-32">{field.replace('canAdd', 'Can Add').replace('canEdit', 'Can Edit').replace('onlyView', 'Only View').replace('canDelete', 'Can Delete').replace('canPrint', 'Can Print')}</Label>
                  <Switch
                    checked={donorModule[field]}
                    onCheckedChange={() => handleIndividualToggle(donorModule, field, setDonorModule)}
                    disabled={!donorModule.allowAccess}
                  />
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex justify-between items-center mb-7">
              <CardTitle>Donations Module</CardTitle>
              <div className="flex items-center space-x-2">
                <Label>Enable all</Label>
                <Switch checked={donationsModule.allowAccess && donationsModule.canAdd && donationsModule.canEdit && donationsModule.onlyView && donationsModule.canDelete && donationsModule.canPrint} onCheckedChange={() => handleEnableAll(donationsModule, setDonationsModule)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Label className="whitespace-nowrap w-32">Allow Access</Label>
                <Switch
                  checked={donationsModule.allowAccess}
                  onCheckedChange={() => handleAllowAccessToggle(donationsModule, setDonationsModule)}
                />
              </div>
              {['canAdd', 'canEdit', 'onlyView', 'canDelete', 'canPrint'].map((field) => (
                <div key={field} className="flex items-center space-x-2">
                  <Label className="whitespace-nowrap w-32">{field.replace('canAdd', 'Can Add').replace('canEdit', 'Can Edit').replace('onlyView', 'Only View').replace('canDelete', 'Can Delete').replace('canPrint', 'Can Print')}</Label>
                  <Switch
                    checked={donationsModule[field]}
                    onCheckedChange={() => handleIndividualToggle(donationsModule, field, setDonationsModule)}
                    disabled={!donationsModule.allowAccess}
                  />
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex justify-between items-center mb-7">
              <CardTitle>Reports Module</CardTitle>
              <div className="flex items-center space-x-2">
                <Label>Enable all</Label>
                <Switch checked={reportsModule.allowAccess && reportsModule.canPrint && reportsModule.onlyView} onCheckedChange={handleEnableAllReports} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Label className="whitespace-nowrap w-32">Allow Access</Label>
                <Switch
                  checked={reportsModule.allowAccess}
                  onCheckedChange={handleAllowAccessToggleReports}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label className="whitespace-nowrap w-32">Can Print</Label>
                <Switch
                  checked={reportsModule.canPrint}
                  onCheckedChange={() => handleIndividualToggleReports('canPrint')}
                  disabled={!reportsModule.allowAccess}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label className="whitespace-nowrap w-32">Only View</Label>
                <Switch
                  checked={reportsModule.onlyView}
                  onCheckedChange={() => handleIndividualToggleReports('onlyView')}
                  disabled={!reportsModule.allowAccess}
                />
              </div>
            </div>
          </Card>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <Button onClick={handleCancel} variant="outline">Cancel</Button>
          <Button className="bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644] hover:text-[#e7e3de]" onClick={handleSave}>Save</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Permissions;