import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconDotsVertical,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
    CardAction,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";
import { Plus, CheckCircle, XCircle } from "lucide-react";
import { AddUserDialog } from "../app/configuration/user/add-user-dialog";
import { EditUserDialog } from "../app/configuration/user/edit-user-dialog";
import { DeleteUserDialog } from "../app/configuration/user/delete-user-dialog";
import { API_BASE_URL } from "@/config/api";
import { useAuth } from "@/config/auth";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

type UserData = {
    user_id: string;
    username: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
    last_login?: string;
};

type PaginationInfo = {
    page: number;
    limit: number;
    total: number;
    pages: number;
};

export default function UserAccessTable() {
    const [data, setData] = useState<UserData[]>([]);
    const [selectedUser, setSelectedUser] = useState<{
        id: string;
        username: string;
        email: string;
        role: string;
        status: string;
    }>({
        id: "",
        username: "",
        email: "",
        role: "",
        status: "",
    });

    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 16,
        total: 0,
        pages: 1,
    });
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(API_BASE_URL + "/users", {
                params: {
                    page: pagination.page,
                    limit: pagination.limit,
                },
            });
            setData(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= pagination.pages) {
            setPagination((prev) => ({ ...prev, page }));
        }
    };

    const [openDialog, setOpenDialog] = useState(false);
    const [editDialog, setEditDialog] = useState(false);

    const handleDelete = async (userId: string) => {
        try {
            await axios.delete(`${API_BASE_URL}/users/${userId}`);
            await fetchData();
            toast.success(
                `${selectedUser.username} successfully removed from the system`,
            );
        } catch (err) {
            console.error("Delete error:", err);
            toast.error("Delete Failed");
        }
    };

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        username: "",
        email: "",
        password: "",
        role: "User",
        status: "Active",
    });

    const handleAddSubmit = async () => {
        try {
            const payload = {
                username: newUser.username,
                email: newUser.email,
                password: newUser.password,
                role: newUser.role,
                status: newUser.status,
            };

            await axios.post(`${API_BASE_URL}/users`, payload);

            await fetchData();
            toast.success(`${newUser.username} added successfully`);

            setAddDialogOpen(false);
            setNewUser({
                username: "",
                email: "",
                password: "",
                role: "User",
                status: "Active",
            });
        } catch (err) {
            if (axios.isAxiosError(err)) {
                console.error("Response status:", err.response?.status);
                console.error("Response data:", err.response?.data);
                console.error("Request config:", err.config);

                if (err.response?.status === 400) {
                    toast.error(err.response.data.error || "Invalid data");
                } else if (err.response?.status === 404) {
                    toast.error("API endpoint not found");
                } else if (err.response?.status === 409) {
                    toast.error("Username or email already exists");
                } else {
                    toast.error(`Request failed: ${err.response?.status}`);
                }
            } else {
                console.error("Non-axios error:", err);
                toast.error("An unexpected error occurred");
            }
        }
    };

    const handleEditSubmit = async () => {
        try {
            const existingUser = data.find(
                (user) =>
                    user.username.toLowerCase() ===
                        selectedUser.username.toLowerCase() &&
                    user.user_id !== selectedUser.id,
            );

            if (existingUser) {
                toast.error(
                    "A user with this username already exists. Please choose a different username.",
                );
                return;
            }

            const payload = {
                username: selectedUser.username,
                email: selectedUser.email,
                role: selectedUser.role,
                status: selectedUser.status,
            };

            await axios.put(
                `${API_BASE_URL}/users/${selectedUser.id}`,
                payload,
            );

            await fetchData();
            toast.success(`${selectedUser.username} updated successfully`);
            setEditDialog(false);
        } catch (err) {
            console.error("Update error:", err);

            if (axios.isAxiosError(err) && err.response) {
                const status = err.response.status;
                const message =
                    err.response.data?.message ||
                    err.response.data?.error ||
                    "";

                if (
                    (status === 409 || status === 400) &&
                    (message.toLowerCase().includes("duplicate") ||
                        message.toLowerCase().includes("already exists") ||
                        message.toLowerCase().includes("username"))
                ) {
                    toast.error(
                        "A user with this username already exists. Please choose a different username.",
                    );
                } else if (status === 404) {
                    toast.error("User not found");
                } else {
                    toast.error("Failed to update user");
                }
            } else {
                toast.error("Network error - please check your connection");
            }
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString || typeof dateString !== "string") return "-";

        const normalized = dateString.replace("T", " ").replace("Z", "");
        const parts = normalized.split(" ");
        if (parts.length < 2) return normalized;

        const [datePart, timePart] = parts;

        const [year, month, day] = datePart.split("-");
        if (!year || !month || !day) return normalized;

        const time = timePart.split(".")[0];
        const [hour, minute, second] = time.split(":");

        if (!hour || !minute || !second) return normalized;

        return `${day} ${new Date(
            Number(year),
            Number(month) - 1,
        ).toLocaleString("en-US", {
            month: "short",
        })} ${year}, ${hour}:${minute}:${second}`;
    };

    const handleUserPasswordUpdate = async (
        userId: string,
        newPassword: string,
    ) => {
        try {
            await axios.put(`${API_BASE_URL}/users/${userId}/password`, {
                newPassword,
            });
        } catch (err) {
            console.error("Password update error:", err);
            throw err;
        }
    };

    const { isAdmin } = useAuth();

    return (
        <Card className="@container/card flex-1 min-h-[600px] overflow-hidden bg-transparent border-0 shadow-none">
            <CardHeader>
                <CardTitle>User Access Management</CardTitle>
                <CardDescription>
                    <span className="hidden @[540px]/card:block">
                        Manage user accounts and access permissions
                    </span>
                    <span className="@[540px]/card:hidden">
                        User management
                    </span>
                </CardDescription>

                <CardAction className="flex flex-col sm:flex-row sm:items-center">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="inline-block">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9"
                                    disabled={!isAdmin}
                                    onClick={() => {
                                        setAddDialogOpen(true);
                                    }}
                                >
                                    <Plus className="h-4 w-4" /> Add User
                                </Button>
                            </span>
                        </TooltipTrigger>
                        {!isAdmin && (
                            <TooltipContent side="left">
                                <p>Only admin can add new user</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                    <AddUserDialog
                        open={addDialogOpen}
                        onOpenChange={setAddDialogOpen}
                        user={newUser}
                        setUser={setNewUser}
                        onSubmit={handleAddSubmit}
                    />
                </CardAction>
            </CardHeader>
            <Tabs defaultValue="outline" className="w-full flex-col gap-4">
                <TabsContent
                    value="outline"
                    className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
                >
                    <div className="overflow-x-auto rounded-lg border">
                        <Table className="min-w-[800px]">
                            <TableHeader className="bg-muted sticky top-0 z-10">
                                <TableRow>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Login</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length > 0 ? (
                                    data.map((row) => (
                                        <TableRow
                                            key={row.user_id}
                                            className="hover:bg-primary/20 transition-colors"
                                        >
                                            <TableCell className="font-medium">
                                                {row.username}
                                            </TableCell>
                                            <TableCell>{row.email}</TableCell>
                                            <TableCell>{row.role}</TableCell>
                                            <TableCell>
                                                {" "}
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        row.status === "Active"
                                                            ? "border-green-300 text-green-500 dark:border-green-900 dark:text-green-400"
                                                            : "border-red-300 text-red-500 dark:border-red-900 dark:text-red-400"
                                                    }
                                                >
                                                    {row.status === "Active" ? (
                                                        <>
                                                            <CheckCircle className="w-4 h-4" />
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="w-4 h-4" />
                                                            Inactive
                                                        </>
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDate(row.last_login)}
                                            </TableCell>
                                            <TableCell className="p-0 pr-2 text-right w-[40px]">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            className="data-[state=open]:bg-muted text-muted-foreground flex size-3"
                                                            size="icon"
                                                        >
                                                            <IconDotsVertical />
                                                        </Button>
                                                    </DropdownMenuTrigger>

                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-32"
                                                    >
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <div>
                                                                    <DropdownMenuItem
                                                                        disabled={
                                                                            !isAdmin
                                                                        }
                                                                        className={
                                                                            !isAdmin
                                                                                ? "opacity-50 cursor-not-allowed"
                                                                                : ""
                                                                        }
                                                                        onClick={() => {
                                                                            setEditDialog(
                                                                                true,
                                                                            );
                                                                            setSelectedUser(
                                                                                {
                                                                                    id: row.user_id,
                                                                                    username:
                                                                                        row.username,
                                                                                    email: row.email,
                                                                                    role: row.role,
                                                                                    status: row.status,
                                                                                },
                                                                            );
                                                                        }}
                                                                    >
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                </div>
                                                            </TooltipTrigger>
                                                            {!isAdmin && (
                                                                <TooltipContent side="left">
                                                                    <p>
                                                                        Only
                                                                        admin
                                                                        can edit
                                                                        user
                                                                    </p>
                                                                </TooltipContent>
                                                            )}
                                                        </Tooltip>

                                                        <DropdownMenuSeparator />
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <div>
                                                                    <DropdownMenuItem
                                                                        disabled={
                                                                            !isAdmin
                                                                        }
                                                                        className={
                                                                            !isAdmin
                                                                                ? "opacity-50 cursor-not-allowed"
                                                                                : ""
                                                                        }
                                                                        variant="destructive"
                                                                        onClick={() => {
                                                                            setOpenDialog(
                                                                                true,
                                                                            );
                                                                            setSelectedUser(
                                                                                {
                                                                                    id: row.user_id,
                                                                                    username:
                                                                                        row.username,
                                                                                    email: row.email,
                                                                                    role: row.role,
                                                                                    status: row.status,
                                                                                },
                                                                            );
                                                                        }}
                                                                    >
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </div>
                                                            </TooltipTrigger>
                                                            {!isAdmin && (
                                                                <TooltipContent side="left">
                                                                    <p>
                                                                        Only
                                                                        admin
                                                                        can
                                                                        delete
                                                                        user
                                                                    </p>
                                                                </TooltipContent>
                                                            )}
                                                        </Tooltip>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-center font-medium"
                                        >
                                            {loading
                                                ? "Loading..."
                                                : "No records found."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <DeleteUserDialog
                            open={openDialog}
                            onOpenChange={setOpenDialog}
                            user={selectedUser}
                            onDelete={handleDelete}
                        />
                        <EditUserDialog
                            open={editDialog}
                            onOpenChange={setEditDialog}
                            user={selectedUser}
                            setUser={setSelectedUser}
                            onSubmit={handleEditSubmit}
                            onPasswordSubmit={handleUserPasswordUpdate}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-muted-foreground text-sm">
                            {pagination.total} user(s) found
                        </div>

                        <div className="flex items-center gap-1 flex-wrap">
                            <Button
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => goToPage(1)}
                                disabled={loading || pagination.page === 1}
                            >
                                <IconChevronsLeft className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => goToPage(pagination.page - 1)}
                                disabled={loading || pagination.page === 1}
                            >
                                <IconChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="px-2 text-sm font-medium">
                                Page {pagination.page} of {pagination.pages}
                            </div>

                            <Button
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => goToPage(pagination.page + 1)}
                                disabled={
                                    loading ||
                                    pagination.page === pagination.pages
                                }
                            >
                                <IconChevronRight className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => goToPage(pagination.pages)}
                                disabled={
                                    loading ||
                                    pagination.page === pagination.pages
                                }
                            >
                                <IconChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </Card>
    );
}
