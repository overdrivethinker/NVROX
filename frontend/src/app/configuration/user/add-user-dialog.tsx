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
import { toast } from "sonner";

type User = {
	username: string;
	email: string;
	password: string;
	role: string;
	status: string;
};

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: User;
	setUser: (user: User) => void;
	onSubmit: () => void;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (email: string): boolean => {
	if (!email) return false;
	return EMAIL_REGEX.test(email.trim());
};

const isValidPassword = (password: string): boolean => {
	return password.length >= 8;
};

export function AddUserDialog({
	open,
	onOpenChange,
	user,
	setUser,
	onSubmit,
}: Props) {
	const [emailError, setEmailError] = useState<string>("");
	const [passwordError, setPasswordError] = useState<string>("");

	const handleEmailChange = (value: string) => {
		setUser({
			...user,
			email: value.toLowerCase(),
		});

		if (value.length > 0) {
			if (!isValidEmail(value)) {
				setEmailError("Invalid email format");
			} else {
				setEmailError("");
			}
		} else {
			setEmailError("");
		}
	};

	const handlePasswordChange = (value: string) => {
		setUser({
			...user,
			password: value,
		});

		if (value.length > 0) {
			if (!isValidPassword(value)) {
				setPasswordError("Password must be at least 8 characters");
			} else {
				setPasswordError("");
			}
		} else {
			setPasswordError("");
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
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

		if (!user.password.trim()) {
			setPasswordError("Password is required");
			return;
		}

		if (!isValidPassword(user.password)) {
			setPasswordError("Password must be at least 8 characters");
			return;
		}

		setEmailError("");
		setPasswordError("");
		onSubmit();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add New User</DialogTitle>
					<DialogDescription>
						Fill in the details to create a new user account.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="grid grid-cols-1 gap-4 py-2">
						<div className="space-y-2">
							<Label htmlFor="username">Username</Label>
							<Input
								id="username"
								name="username"
								value={user.username}
								placeholder="Enter username"
								required
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
								name="email"
								type="email"
								value={user.email}
								placeholder="user@example.com"
								className={emailError ? "border-red-500" : ""}
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
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								name="password"
								type="password"
								value={user.password}
								placeholder="Enter password"
								className={
									passwordError ? "border-red-500" : ""
								}
								onChange={(e) =>
									handlePasswordChange(e.target.value)
								}
							/>
							{passwordError && (
								<p className="text-sm text-red-500">
									{passwordError}
								</p>
							)}
							<p className="text-xs text-muted-foreground">
								Minimum 8 characters
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="role">Role</Label>
							<Select
								value={user.role}
								onValueChange={(value) =>
									setUser({ ...user, role: value })
								}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select role" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Admin">Admin</SelectItem>
									<SelectItem value="User">User</SelectItem>
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
									<SelectValue placeholder="Select status" />
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
								!!emailError ||
								!!passwordError ||
								!user.username.trim() ||
								!user.email.trim() ||
								!user.password.trim()
							}>
							Add User
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
