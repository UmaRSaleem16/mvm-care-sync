"""
Management command: python manage.py seed_data

Populates the database with:
  - Service types
  - ASC facilities (Carewell, Tilden, CSS Bethlehem, Muhlenberg, Emmaus)
  - Sample vendors per service category
  - VendorCoverageRule mappings per facility+service
  - A default admin user for local development
"""
import logging

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.case_requests.models import VendorCoverageRule
from apps.facilities.models import Facility
from apps.vendors.models import ServiceType, Vendor

logger = logging.getLogger(__name__)

SERVICE_TYPES = [
    {
        'name': 'Anesthesia',
        'code': 'ANES',
        'description': 'Anesthesia services',
    },
    {
        'name': 'CRNA / Anesthesia Backup',
        'code': 'CRNA',
        'description': 'Certified Registered Nurse Anesthetist backup coverage',
    },
    {
        'name': 'Neuro Monitoring',
        'code': 'NEURO',
        'description': 'Intraoperative neurophysiological monitoring',
    },
    {
        'name': 'Device Rep',
        'code': 'DEVICE',
        'description': 'Medical device representative support',
    },
    {
        'name': 'Ultrasound Tech',
        'code': 'US',
        'description': 'Ultrasound technologist services',
    },
    {
        'name': 'Other Contracted Vendor',
        'code': 'OTHER',
        'description': 'Other contracted vendor services',
    },
]

FACILITIES = [
    {
        'name': 'Carewell ASC',
        'address': '123 Carewell Blvd',
        'city': 'Bethlehem',
        'state': 'PA',
        'zip_code': '18015',
        'contact_person': 'Sarah Johnson',
        'phone': '610-555-0101',
        'internal_coordinator': 'Mike Torres',
        'default_arrival_rules': 'Vendors must arrive 30 minutes before first case start time.',
        'parking_access_notes': 'Park in Lot B. Use side entrance, badge required.',
        'vendor_specific_instructions': (
            'Check in at OR front desk. Wear visitor badge at all times.'
        ),
        'notes': 'Busiest facility — confirm 48 hours in advance.',
    },
    {
        'name': 'Tilden Surgery Center',
        'address': '456 Tilden Ave',
        'city': 'Allentown',
        'state': 'PA',
        'zip_code': '18101',
        'contact_person': 'David Kim',
        'phone': '610-555-0202',
        'internal_coordinator': 'Lisa Chen',
        'default_arrival_rules': 'Arrive 20 minutes before case start.',
        'parking_access_notes': 'Free parking in main lot. Enter through main lobby.',
        'vendor_specific_instructions': (
            'Sign in at front desk. HIPAA acknowledgment required on first visit.'
        ),
        'notes': 'Primarily neuro monitoring and device rep cases.',
    },
    {
        'name': 'CSS Bethlehem',
        'address': '789 Steel City Dr',
        'city': 'Bethlehem',
        'state': 'PA',
        'zip_code': '18016',
        'contact_person': 'Rachel Martinez',
        'phone': '610-555-0303',
        'internal_coordinator': 'Tom Nguyen',
        'default_arrival_rules': 'Arrive 15 minutes early. Call OR charge nurse on arrival.',
        'parking_access_notes': 'Parking garage Level 2. Validate at reception.',
        'vendor_specific_instructions': (
            'All vendors must be credentialed. Check status with admin office.'
        ),
        'notes': 'Strict credentialing requirements — confirm status before request.',
    },
    {
        'name': 'Muhlenberg Outpatient Center',
        'address': '321 Campus Rd',
        'city': 'Bethlehem',
        'state': 'PA',
        'zip_code': '18017',
        'contact_person': 'Amy Wilson',
        'phone': '610-555-0404',
        'internal_coordinator': 'James Park',
        'default_arrival_rules': 'Vendors arrive 25 minutes before scheduled start.',
        'parking_access_notes': 'Visitor lot on east side of building.',
        'vendor_specific_instructions': (
            'Contact OR coordinator upon arrival. Do not enter OR without escort.'
        ),
        'notes': 'Primarily orthopedic and spine cases requiring device reps.',
    },
    {
        'name': 'Emmaus Surgery Center',
        'address': '654 Main Street',
        'city': 'Emmaus',
        'state': 'PA',
        'zip_code': '18049',
        'contact_person': 'Patricia Brown',
        'phone': '610-555-0505',
        'internal_coordinator': 'Kevin Davis',
        'default_arrival_rules': 'Arrive 20 minutes early. Text coordinator on arrival.',
        'parking_access_notes': 'Street parking available. No dedicated lot.',
        'vendor_specific_instructions': 'Small facility — coordinate directly with OR staff.',
        'notes': 'Smaller caseload. Friendly staff. Good for CRNA backup.',
    },
]

VENDORS = [
    {
        'name': 'Premier Anesthesia Associates',
        'service_type_code': 'ANES',
        'contact_name': 'Dr. Robert Hayes',
        'contact_email': 'rhayes@premieranesthesia.example.com',
        'contact_phone': '610-555-1001',
        'backup_contact_name': 'Dr. Susan Lee',
        'backup_contact_email': 'slee@premieranesthesia.example.com',
        'contract_status': 'active',
        'credentialing_status': 'approved',
        'services_provided': 'General anesthesia, MAC, regional blocks',
        'is_active': True,
    },
    {
        'name': 'Valley Anesthesia Group',
        'service_type_code': 'ANES',
        'contact_name': 'Dr. Michael Chen',
        'contact_email': 'mchen@valleyanesthesia.example.com',
        'contact_phone': '610-555-1002',
        'contract_status': 'active',
        'credentialing_status': 'approved',
        'services_provided': 'General anesthesia, pediatric anesthesia',
        'is_active': True,
    },
    {
        'name': 'Lehigh Valley CRNA Services',
        'service_type_code': 'CRNA',
        'contact_name': 'Jennifer Walsh, CRNA',
        'contact_email': 'jwalsh@lvcrna.example.com',
        'contact_phone': '610-555-2001',
        'backup_contact_name': 'Mark Thompson, CRNA',
        'backup_contact_email': 'mthompson@lvcrna.example.com',
        'contract_status': 'active',
        'credentialing_status': 'approved',
        'services_provided': 'MAC anesthesia, anesthesia backup coverage',
        'is_active': True,
    },
    {
        'name': 'Northeast CRNA Network',
        'service_type_code': 'CRNA',
        'contact_name': 'Chris Porter, CRNA',
        'contact_email': 'cporter@necrna.example.com',
        'contact_phone': '610-555-2002',
        'contract_status': 'active',
        'credentialing_status': 'approved',
        'services_provided': 'Anesthesia backup, on-call CRNA coverage',
        'is_active': True,
    },
    {
        'name': 'NeuroMonitor Pro',
        'service_type_code': 'NEURO',
        'contact_name': 'Dr. Amanda Foster',
        'contact_email': 'afoster@neuromonitorpro.example.com',
        'contact_phone': '610-555-3001',
        'backup_contact_name': 'Brian Scott',
        'backup_contact_email': 'bscott@neuromonitorpro.example.com',
        'contract_status': 'active',
        'credentialing_status': 'approved',
        'services_provided': 'SSEP, MEP, EMG, EEG intraoperative monitoring',
        'is_active': True,
    },
    {
        'name': 'Spine Monitor Associates',
        'service_type_code': 'NEURO',
        'contact_name': 'Dr. Lisa Wang',
        'contact_email': 'lwang@spinemonitor.example.com',
        'contact_phone': '610-555-3002',
        'contract_status': 'active',
        'credentialing_status': 'approved',
        'services_provided': 'Spinal cord monitoring, nerve integrity monitoring',
        'is_active': True,
    },
    {
        'name': 'MedTech Device Representatives',
        'service_type_code': 'DEVICE',
        'contact_name': 'Carlos Rodriguez',
        'contact_email': 'crodriguez@medtechdevice.example.com',
        'contact_phone': '610-555-4001',
        'contract_status': 'active',
        'credentialing_status': 'approved',
        'services_provided': 'Orthopedic implants, spine hardware, instrument support',
        'is_active': True,
    },
    {
        'name': 'Keystone Medical Devices',
        'service_type_code': 'DEVICE',
        'contact_name': 'Sarah Palmer',
        'contact_email': 'spalmer@keystonedevice.example.com',
        'contact_phone': '610-555-4002',
        'contract_status': 'active',
        'credentialing_status': 'pending',
        'services_provided': 'Cardiovascular devices, general surgical devices',
        'notes': 'Credentialing application submitted 2024-10.',
        'is_active': True,
    },
    {
        'name': 'Allied Ultrasound Services',
        'service_type_code': 'US',
        'contact_name': 'Nancy Oliver',
        'contact_email': 'noliver@alliedultrasound.example.com',
        'contact_phone': '610-555-5001',
        'contract_status': 'active',
        'credentialing_status': 'approved',
        'services_provided': 'Intraoperative ultrasound, vascular access guidance',
        'is_active': True,
    },
    {
        'name': 'PA Contracted Services LLC',
        'service_type_code': 'OTHER',
        'contact_name': 'Frank Martin',
        'contact_email': 'fmartin@pacontracted.example.com',
        'contact_phone': '610-555-6001',
        'contract_status': 'active',
        'credentialing_status': 'not_required',
        'services_provided': 'Miscellaneous contracted surgical support',
        'is_active': True,
    },
]

# (vendor_name, facility_name, is_preferred)
COVERAGE_RULES = [
    ('Premier Anesthesia Associates', 'Carewell ASC', True),
    ('Premier Anesthesia Associates', 'Tilden Surgery Center', False),
    ('Premier Anesthesia Associates', 'CSS Bethlehem', True),
    ('Premier Anesthesia Associates', 'Muhlenberg Outpatient Center', False),
    ('Premier Anesthesia Associates', 'Emmaus Surgery Center', False),
    ('Valley Anesthesia Group', 'Tilden Surgery Center', True),
    ('Valley Anesthesia Group', 'Emmaus Surgery Center', True),
    ('Lehigh Valley CRNA Services', 'Carewell ASC', True),
    ('Lehigh Valley CRNA Services', 'Tilden Surgery Center', True),
    ('Lehigh Valley CRNA Services', 'CSS Bethlehem', True),
    ('Lehigh Valley CRNA Services', 'Muhlenberg Outpatient Center', True),
    ('Lehigh Valley CRNA Services', 'Emmaus Surgery Center', True),
    ('Northeast CRNA Network', 'Carewell ASC', False),
    ('Northeast CRNA Network', 'Tilden Surgery Center', False),
    ('Northeast CRNA Network', 'Emmaus Surgery Center', False),
    ('NeuroMonitor Pro', 'Tilden Surgery Center', True),
    ('NeuroMonitor Pro', 'Carewell ASC', True),
    ('NeuroMonitor Pro', 'Muhlenberg Outpatient Center', True),
    ('Spine Monitor Associates', 'CSS Bethlehem', True),
    ('Spine Monitor Associates', 'Tilden Surgery Center', False),
    ('MedTech Device Representatives', 'Carewell ASC', True),
    ('MedTech Device Representatives', 'CSS Bethlehem', True),
    ('MedTech Device Representatives', 'Muhlenberg Outpatient Center', True),
    ('MedTech Device Representatives', 'Emmaus Surgery Center', True),
    ('Keystone Medical Devices', 'Tilden Surgery Center', True),
    ('Keystone Medical Devices', 'Carewell ASC', False),
    ('Allied Ultrasound Services', 'Carewell ASC', True),
    ('Allied Ultrasound Services', 'CSS Bethlehem', True),
    ('Allied Ultrasound Services', 'Tilden Surgery Center', True),
    ('PA Contracted Services LLC', 'Carewell ASC', True),
    ('PA Contracted Services LLC', 'Tilden Surgery Center', True),
    ('PA Contracted Services LLC', 'CSS Bethlehem', True),
    ('PA Contracted Services LLC', 'Muhlenberg Outpatient Center', True),
    ('PA Contracted Services LLC', 'Emmaus Surgery Center', True),
]


class Command(BaseCommand):
    help = 'Seed the database with sample ASCs, service types, vendors, and coverage rules.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear', action='store_true', help='Clear existing seed data first.'
        )

    def handle(self, *args, **options):
        if options['clear']:
            self._clear()

        service_types = self._seed_service_types()
        facilities = self._seed_facilities()
        vendors = self._seed_vendors(service_types)
        self._seed_coverage_rules(vendors, facilities)
        self._seed_admin_user()
        self._seed_test_users()

        self.stdout.write(self.style.SUCCESS(
            f'\n✅  Seed complete: {len(service_types)} service types, '
            f'{len(facilities)} facilities, {len(vendors)} vendors.'
        ))

    def _clear(self):
        self.stdout.write('Clearing existing seed data...')
        VendorCoverageRule.objects.all().delete()
        Vendor.objects.all().delete()
        ServiceType.objects.all().delete()
        Facility.objects.all().delete()

    def _seed_service_types(self):
        result = {}
        for data in SERVICE_TYPES:
            st, created = ServiceType.objects.update_or_create(
                code=data['code'], defaults=data
            )
            result[data['code']] = st
            self.stdout.write(f"  {'✚' if created else '↺'} ServiceType: {st.name}")
        return result

    def _seed_facilities(self):
        result = {}
        for data in FACILITIES:
            fac, created = Facility.objects.update_or_create(
                name=data['name'], defaults=data
            )
            result[data['name']] = fac
            self.stdout.write(f"  {'✚' if created else '↺'} Facility: {fac.name}")
        return result

    def _seed_vendors(self, service_types):
        result = {}
        for data in VENDORS:
            code = data.pop('service_type_code')
            data['service_type'] = service_types[code]
            vendor, created = Vendor.objects.update_or_create(
                name=data['name'], defaults=data
            )
            result[vendor.name] = vendor
            svc = vendor.service_type.name
            self.stdout.write(
                f"  {'✚' if created else '↺'} Vendor: {vendor.name} ({svc})"
            )
            data['service_type_code'] = code
        return result

    def _seed_coverage_rules(self, vendors, facilities):
        count = 0
        for vendor_name, facility_name, is_preferred in COVERAGE_RULES:
            vendor = vendors.get(vendor_name)
            facility = facilities.get(facility_name)
            if not vendor or not facility:
                self.stdout.write(
                    self.style.WARNING(
                        f'  ⚠ Skipping rule: {vendor_name} / {facility_name}'
                    )
                )
                continue
            _, created = VendorCoverageRule.objects.update_or_create(
                vendor=vendor,
                facility=facility,
                service_type=vendor.service_type,
                defaults={'is_preferred': is_preferred, 'is_active': True},
            )
            if created:
                count += 1
        self.stdout.write(f'  ✚ Coverage rules: {count} created / updated.')

    def _seed_admin_user(self):
        User = get_user_model()
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@mvmcaresync.local',
                password='Admin123!',
                first_name='Portal',
                last_name='Admin',
                role='admin',
            )
            self.stdout.write(
                self.style.SUCCESS('  ✚ Superuser: admin / Admin123!')
            )
        else:
            self.stdout.write('  ↺ Admin user already exists.')

    def _seed_test_users(self):
        User = get_user_model()
        test_users = [
            {
                'username': 'coordinator1',
                'email': 'coordinator@mvmcaresync.local',
                'password': 'Coord123!',
                'first_name': 'Sarah',
                'last_name': 'Coordinator',
                'role': 'coordinator',
                'department': 'OR Scheduling',
            },
            {
                'username': 'staff1',
                'email': 'staff@mvmcaresync.local',
                'password': 'Staff123!',
                'first_name': 'Mike',
                'last_name': 'Staff',
                'role': 'staff',
                'department': 'Clinical Staff',
            },
            {
                'username': 'readonly1',
                'email': 'readonly@mvmcaresync.local',
                'password': 'Read123!',
                'first_name': 'Rachel',
                'last_name': 'Viewer',
                'role': 'readonly',
                'department': 'Operations',
            },
        ]
        for data in test_users:
            username = data['username']
            if not User.objects.filter(username=username).exists():
                User.objects.create_user(**data)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  ✚ User [{data['role']}]: {username} / {data['password']}"
                    )
                )
            else:
                self.stdout.write(f'  ↺ User already exists: {username}')
