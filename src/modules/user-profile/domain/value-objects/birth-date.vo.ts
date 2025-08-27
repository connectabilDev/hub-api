export class BirthDate {
  constructor(private readonly value: Date) {
    this.validate();
  }

  private validate(): void {
    if (!this.value || !(this.value instanceof Date)) {
      throw new Error('Birth date must be a valid Date');
    }

    if (this.value > new Date()) {
      throw new Error('Birth date cannot be in the future');
    }

    const age = this.calculateAge();
    if (age < 18) {
      throw new Error('User must be at least 18 years old');
    }

    if (age > 120) {
      throw new Error('Invalid birth date - age cannot exceed 120 years');
    }
  }

  private calculateAge(): number {
    const today = new Date();
    const birthYear = this.value.getFullYear();
    const birthMonth = this.value.getMonth();
    const birthDay = this.value.getDate();

    let age = today.getFullYear() - birthYear;

    if (
      today.getMonth() < birthMonth ||
      (today.getMonth() === birthMonth && today.getDate() < birthDay)
    ) {
      age--;
    }

    return age;
  }

  getValue(): Date {
    return this.value;
  }

  getAge(): number {
    return this.calculateAge();
  }

  toString(): string {
    return this.value.toISOString().split('T')[0];
  }

  equals(other: BirthDate): boolean {
    return this.value.getTime() === other.value.getTime();
  }
}
