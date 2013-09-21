import csv
import sys

# prefixes for the 11 counties of the PHL metropolitan area
to_include = ['42101', '42045', '42091', '42017', '42029', '10003', '34015', '34007', '34033', '34005', '24015']

def main():

	to_keep = []

	header = loop_file(sys.argv[1], to_keep)

	loop_file(sys.argv[2], to_keep)

	with open('PA.csv', 'wb') as f:
		out_file = csv.writer(f)
		out_file.writerow(header)
		out_file.writerows(to_keep)

def loop_file(in_file, to_keep):

	with open(in_file) as f:
		data = csv.reader(f)
		header = data.next()
		for row in data:
			# if we want to change to focus *only* on people who live (i.e., Home) in the 11 counties, then change this to
			# if (row[0][:5] in to_include):
			if (row[0][:5] in to_include) or (row[1][:5] in to_include):
				to_keep.append(row)
		return header

if __name__ == '__main__':
	main()