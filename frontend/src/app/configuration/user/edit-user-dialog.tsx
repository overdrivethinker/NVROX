import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type User = {
	id: string;
	username: string;
	email: string;
	role: string;
	status: string;
};

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: User;
	setUser: (user: User) => void;
	onSubmit: () => void;
	onPasswordSubmit: (userId: string, newPassword: string) => Promise<void>;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (email: string) => {
	if (!email) return false;
	return EMAIL_REGEX.test(email.trim());
};

export function EditUserDialog({
	open,
	onOpenChange,
	user,
	setUser,
	onSubmit,
	onPasswordSubmit,
}: Props) {
	const [emailError, setEmailError] = useState<string>("");
	const [newPassword, setNewPassword] = useState("");

	const handleEmailChange = (value: string) => {
		setUser({ ...user, email: value.toLowerCase() });

		if (value.length > 0) {
			if (!isValidEmail(value)) setEmailError("Invalid email format");
			else setEmailError("");
		} else setEmailError("");
	};

	const handleGeneralSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!user.username.trim()) {
			toast.error("Username is required");
			return;
		}
		if (!user.email.trim()) {
			setEmailError("Email is required");
			return;
		}
		if (!isValidEmail(user.email)) {
			setEmailError("Please enter a valid email address");
			return;
		}

		setEmailError("");
		onSubmit();
	};

	const handlePasswordSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!newPassword.trim()) {
			toast.error("Password is required");
			return;
		}
		if (newPassword.length < 8) {
			toast.error("Password must be at least 8 characters");
			return;
		}

		try {
			await onPasswordSubmit(user.id, newPassword);
			toast.success("Password updated successfully");
			setNewPassword("");
		} catch (err) {
			console.error(err);
			toast.error("Failed to update password");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Edit User</DialogTitle>
					<DialogDescription>
						Configure user account settings.
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="general" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="general">General</TabsTrigger>
						<TabsTrigger value="security">Security</TabsTrigger>
					</TabsList>

					<TabsContent value="general" className="space-y-4 mt-4">
						<form onSubmit={handleGeneralSubmit}>
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="userId">User ID</Label>
									<div className="relative">
										<Input
											id="userId"
											value={user.id}
											disabled
											className="bg-muted"
										/>
										<Badge
											variant="secondary"
											className="absolute -top-2 right-0 text-xs">
											Read Only
										</Badge>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="username">Username</Label>
									<Input
										id="username"
										value={user.username}
										onChange={(e) =>
											setUser({
												...user,
												username: e.target.value,
											})
										}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										value={user.email}
										className={
											emailError ? "border-red-500" : ""
										}
										onChange={(e) =>
											handleEmailChange(e.target.value)
										}
									/>
									{emailError && (
										<p className="text-sm text-red-500">
											{emailError}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="role">Role</Label>
									<Select
										value={user.role}
										onValueChange={(value) =>
											setUser({ ...user, role: value })
										}>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Admin">
												Admin
											</SelectItem>
											<SelectItem value="User">
												User
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="status">Status</Label>
									<Select
										value={user.status}
										onValueChange={(value) =>
											setUser({ ...user, status: value })
										}>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Active">
												<div className="flex items-center gap-2">
													<div className="w-2 h-2 bg-green-500 rounded-full"></div>
													Active
												</div>
											</SelectItem>
											<SelectItem value="Inactive">
												<div className="flex items-center gap-2">
													<div className="w-2 h-2 bg-red-500 rounded-full"></div>
													Inactive
												</div>
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<DialogFooter className="mt-6">
								<DialogClose asChild>
									<Button type="button" variant="outline">
										Cancel
									</Button>
								</DialogClose>
								<Button
									type="submit"
									disabled={
										!!emailError || !user.username.trim()
									}>
									Save Changes
								</Button>
							</DialogFooter>
						</form>
					</TabsContent>

					<TabsContent value="security" className="space-y-4 mt-4">
						<form onSubmit={handlePasswordSubmit}>
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="newPassword">
										New Password
									</Label>
									<Input
										id="newPassword"
										type="password"
										value={newPassword}
										placeholder="Enter new password"
										onChange={(e) =>
											setNewPassword(e.target.value)
										}
									/>
									<p className="text-xs text-muted-foreground">
										Minimum 8 characters
									</p>
								</div>

								<div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50 p-3">
									<p className="text-sm text-amber-900 dark:text-amber-200">
										Changing the password will require the
										user to log in again with the new
										password.
									</p>
								</div>
							</div>

							<DialogFooter className="mt-6">
								<DialogClose asChild>
									<Button type="button" variant="outline">
										Cancel
									</Button>
								</DialogClose>
								<Button
									type="submit"
									disabled={
										!newPassword.trim() ||
										newPassword.length < 8
									}>
									Update Password
								</Button>
							</DialogFooter>
						</form>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
